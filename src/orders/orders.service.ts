import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Coupon,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  UserRole,
  CouponStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { SettingsService } from '../settings/settings.service';
import { EmailService } from '../utils/email.service';
import { restoreOrderInventory } from '../utils/order-inventory';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderTrackingDto } from './dto/update-order-tracking.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private settingsService: SettingsService,
    private emailService: EmailService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const settings = await this.settingsService.getSettings();
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });

    if (!address) {
      throw new BadRequestException('Address not found');
    }

    const shopId = cart.items[0]?.product.shopId;
    if (!shopId) {
      throw new BadRequestException('Cart items missing shop');
    }

    for (const item of cart.items) {
      if (item.product.shopId !== shopId) {
        throw new BadRequestException('Cart contains multiple shops');
      }
      if (item.product.status !== ProductStatus.PUBLISHED) {
        throw new BadRequestException(
          `Product ${item.product.name} is unavailable`,
        );
      }
    }

    const orderNumber = this.generateOrderNumber();

    const { orderId, total, orderItems } = await this.prisma.$transaction(
      async (tx) => {
        let subtotalAccumulator = 0;
        const itemsToCreate: Prisma.OrderItemCreateManyOrderInput[] = [];

        const couponCode = dto.couponCode?.toUpperCase();
        let coupon: Coupon | null = null;
        let hasProductScope = false;
        let hasCategoryScope = false;

        if (couponCode) {
          coupon = await tx.coupon.findUnique({
            where: { code: couponCode },
          });

          if (!coupon) {
            throw new BadRequestException('Coupon not found');
          }

          hasProductScope = coupon.applicableProducts.length > 0;
          hasCategoryScope = coupon.applicableCategories.length > 0;

          const now = new Date();
          if (
            coupon.status !== CouponStatus.ACTIVE ||
            coupon.startDate > now ||
            coupon.endDate < now
          ) {
            throw new BadRequestException('Coupon is not active');
          }

          if (coupon.usageLimit) {
            const usageCount = await tx.couponUsage.count({
              where: { couponId: coupon.id },
            });
            if (usageCount >= coupon.usageLimit) {
              throw new BadRequestException('Coupon usage limit reached');
            }
          }

          if (coupon.usagePerUser) {
            const userUsage = await tx.couponUsage.count({
              where: { couponId: coupon.id, userId },
            });
            if (userUsage >= coupon.usagePerUser) {
              throw new BadRequestException('Coupon usage limit reached');
            }
          }
        }

        let eligibleSubtotal = 0;
        for (const item of cart.items) {
          const product = item.product;
          let variantInfo: Prisma.InputJsonValue | null = null;
          let unitPrice = product.salePrice ?? product.basePrice;
          let sku = product.sku;

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.variantId },
            });
            if (!variant || variant.productId !== product.id) {
              throw new BadRequestException('Variant not found');
            }
            const variantUpdate = await tx.productVariant.updateMany({
              where: { id: variant.id, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (variantUpdate.count === 0) {
              throw new BadRequestException(
                `Insufficient stock for ${product.name}`,
              );
            }
            sku = variant.sku;
            if (variant.price !== null) {
              unitPrice = variant.price;
            }
            variantInfo = {
              name: variant.name,
              attributes: variant.attributes,
            };
          }

          const productUpdate = await tx.product.updateMany({
            where: {
              id: product.id,
              status: ProductStatus.PUBLISHED,
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
          if (productUpdate.count === 0) {
            throw new BadRequestException(
              `Insufficient stock for ${product.name}`,
            );
          }

          const lineTotal = unitPrice * item.quantity;
          subtotalAccumulator += lineTotal;

          const orderItem: Prisma.OrderItemCreateManyOrderInput = {
            productId: product.id,
            productName: product.name,
            sku,
            image: product.images[0]?.url ?? null,
            quantity: item.quantity,
            price: unitPrice,
            total: lineTotal,
          };
          if (variantInfo) {
            orderItem.variantInfo = variantInfo;
          }
          itemsToCreate.push(orderItem);

          if (coupon) {
            const matchesProduct =
              hasProductScope &&
              coupon.applicableProducts.includes(product.id);
            const matchesCategory =
              hasCategoryScope &&
              coupon.applicableCategories.includes(product.categoryId);
            const isEligible =
              (!hasProductScope && !hasCategoryScope) ||
              matchesProduct ||
              matchesCategory;

            if (isEligible) {
              eligibleSubtotal += lineTotal;
            }
          }

        }

        const shippingCost =
          subtotalAccumulator >= settings.shippingThreshold
            ? 0
            : settings.baseShippingCost;
        let discountAmount = 0;
        let itemDiscount = 0;
        if (coupon) {
          const hasScope = hasProductScope || hasCategoryScope;
          const discountBase = hasScope ? eligibleSubtotal : subtotalAccumulator;

          if (hasScope && eligibleSubtotal <= 0) {
            throw new BadRequestException(
              'Coupon is not applicable to items in cart',
            );
          }

          if (coupon.minPurchase && discountBase < coupon.minPurchase) {
            throw new BadRequestException(
              'Cart total does not meet coupon requirements',
            );
          }

          if (coupon.type === 'PERCENTAGE') {
            discountAmount = (discountBase * coupon.value) / 100;
          } else if (coupon.type === 'FIXED_AMOUNT') {
            discountAmount = coupon.value;
          } else if (coupon.type === 'FREE_SHIPPING') {
            discountAmount = shippingCost;
          }

          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }

          const maxDiscountAllowed =
            coupon.type === 'FREE_SHIPPING'
              ? discountBase + shippingCost
              : discountBase;
          if (discountAmount > maxDiscountAllowed) {
            discountAmount = maxDiscountAllowed;
          }

          itemDiscount =
            coupon.type === 'FREE_SHIPPING' ? 0 : discountAmount;
        }

        const taxBase = Math.max(0, subtotalAccumulator - itemDiscount);
        const taxAmount = taxBase * settings.taxRate;
        const totalAmount =
          subtotalAccumulator - discountAmount + shippingCost + taxAmount;

        const createdOrder = await tx.order.create({
          data: {
            userId,
            shopId,
            addressId: address.id,
            orderNumber,
            subtotal: subtotalAccumulator,
            tax: taxAmount,
            shippingCost,
            discount: discountAmount,
            total: totalAmount,
            paymentMethod: dto.paymentMethod,
            orderStatus: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.PENDING,
            customerNote: dto.customerNote,
            couponCode: coupon?.code ?? couponCode,
            couponDiscount: coupon ? discountAmount : null,
            items: {
              createMany: {
                data: itemsToCreate,
              },
            },
          },
        });

        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId,
              orderId: createdOrder.id,
              discount: discountAmount,
            },
          });
        }

        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return {
          orderId: createdOrder.id,
          total: totalAmount,
          orderItems: itemsToCreate,
        };
      },
    );

    let clientSecret: string | null = null;
    if (dto.paymentMethod === PaymentMethod.CARD) {
      try {
        const intent = await this.paymentsService.createPaymentIntent({
          amount: total,
          currency: 'usd',
          metadata: {
            orderId,
            userId,
          },
        });

        clientSecret = intent.client_secret ?? null;
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            stripePaymentId: intent.id,
          },
        });
      } catch (error) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.FAILED,
            orderStatus: OrderStatus.CANCELLED,
            cancelledAt: new Date(),
          },
        });
        await this.prisma.couponUsage.deleteMany({
          where: { orderId },
        });
        await restoreOrderInventory(
          this.prisma,
          orderItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            sku: item.sku,
            variantInfo: item.variantInfo,
          })),
        );
        throw error;
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
      },
    });

    if (order) {
      await this.sendOrderEmail(userId, `Order ${order.orderNumber} received`, [
        `We received your order ${order.orderNumber}.`,
        `Order total: $${order.total.toFixed(2)}.`,
        `Payment method: ${this.formatLabel(order.paymentMethod)}.`,
      ]);
    }

    return {
      order,
      clientSecret,
      items: orderItems,
    };
  }

  async listOrders(userId: string, role: UserRole, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (role === UserRole.USER) {
      where.userId = userId;
    }

    if (role === UserRole.VENDOR) {
      const shop = await this.prisma.shop.findUnique({
        where: { vendorId: userId },
      });
      if (!shop) {
        return { data: [], meta: { total: 0, page, limit, totalPages: 0 } };
      }
      where.shopId = shop.id;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          address: true,
          shop: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(userId: string, role: UserRole, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        shop: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.USER && order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (role === UserRole.VENDOR) {
      const shop = await this.prisma.shop.findUnique({
        where: { vendorId: userId },
      });
      if (!shop || order.shopId !== shop.id) {
        throw new NotFoundException('Order not found');
      }
    }

    return order;
  }

  async updateStatus(
    userId: string,
    role: UserRole,
    orderId: string,
    status: OrderStatus,
  ) {
    const order = await this.getOrder(userId, role, orderId);

    const timestampData: Record<string, Date> = {};
    const paymentStatusUpdate: Partial<{ paymentStatus: PaymentStatus }> = {};
    if (status === OrderStatus.SHIPPED) {
      timestampData.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      timestampData.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      timestampData.cancelledAt = new Date();
      if (order.paymentStatus === PaymentStatus.PENDING) {
        paymentStatusUpdate.paymentStatus = PaymentStatus.FAILED;
      }
    } else if (status === OrderStatus.REFUNDED) {
      timestampData.cancelledAt = new Date();
      paymentStatusUpdate.paymentStatus = PaymentStatus.REFUNDED;
    }

    const shouldRestoreInventory =
      status === OrderStatus.CANCELLED &&
      order.orderStatus !== OrderStatus.CANCELLED &&
      order.paymentStatus !== PaymentStatus.PAID;
    const shouldRestoreRefund =
      status === OrderStatus.REFUNDED &&
      order.orderStatus !== OrderStatus.REFUNDED;

    if (shouldRestoreInventory || shouldRestoreRefund) {
      await restoreOrderInventory(
        this.prisma,
        order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          sku: item.sku,
          variantInfo: item.variantInfo,
        })),
      );

      if (shouldRestoreInventory) {
        await this.prisma.couponUsage.deleteMany({
          where: { orderId: order.id },
        });
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: status,
        ...paymentStatusUpdate,
        ...timestampData,
      },
    });

    if (status !== order.orderStatus) {
      const statusLabel = this.formatLabel(status);
      const lines = [
        `Your order ${updatedOrder.orderNumber} is now ${statusLabel.toLowerCase()}.`,
      ];

      if (status === OrderStatus.SHIPPED && updatedOrder.trackingNumber) {
        const carrierLabel = updatedOrder.carrier
          ? ` (${updatedOrder.carrier})`
          : '';
        lines.push(`Tracking number: ${updatedOrder.trackingNumber}${carrierLabel}.`);
      }

      await this.sendOrderEmail(
        updatedOrder.userId,
        `Order ${updatedOrder.orderNumber} ${statusLabel}`,
        lines,
      );
    }

    return updatedOrder;
  }

  async updateTracking(
    userId: string,
    role: UserRole,
    orderId: string,
    dto: UpdateOrderTrackingDto,
  ) {
    const order = await this.getOrder(userId, role, orderId);

    if (!dto.trackingNumber && !dto.carrier) {
      throw new BadRequestException('Tracking update requires data');
    }

    const data: Prisma.OrderUpdateInput = {
      trackingNumber: dto.trackingNumber ?? order.trackingNumber,
      carrier: dto.carrier ?? order.carrier,
    };

    if (
      dto.trackingNumber &&
      (order.orderStatus === OrderStatus.PROCESSING ||
        order.orderStatus === OrderStatus.CONFIRMED)
    ) {
      data.orderStatus = OrderStatus.SHIPPED;
      data.shippedAt = new Date();
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data,
    });

    const details: string[] = [
      `Tracking update for order ${updatedOrder.orderNumber}.`,
    ];

    if (updatedOrder.trackingNumber) {
      details.push(`Tracking number: ${updatedOrder.trackingNumber}.`);
    }
    if (updatedOrder.carrier) {
      details.push(`Carrier: ${updatedOrder.carrier}.`);
    }

    await this.sendOrderEmail(
      updatedOrder.userId,
      `Tracking update for ${updatedOrder.orderNumber}`,
      details,
    );

    return updatedOrder;
  }

  async cancelOrder(userId: string, role: UserRole, orderId: string) {
    const order = await this.getOrder(userId, role, orderId);

    if (order.orderStatus === OrderStatus.CANCELLED) {
      return order;
    }

    if (
      order.orderStatus === OrderStatus.SHIPPED ||
      order.orderStatus === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException('Order cannot be cancelled after shipping');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Paid orders require a refund');
    }

    await restoreOrderInventory(
      this.prisma,
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        sku: item.sku,
        variantInfo: item.variantInfo,
      })),
    );

    await this.prisma.couponUsage.deleteMany({
      where: { orderId: order.id },
    });

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: OrderStatus.CANCELLED,
        paymentStatus:
          order.paymentStatus === PaymentStatus.PENDING
            ? PaymentStatus.FAILED
            : order.paymentStatus,
        cancelledAt: new Date(),
      },
    });

    await this.sendOrderEmail(
      updatedOrder.userId,
      `Order ${updatedOrder.orderNumber} cancelled`,
      [
        `Your order ${updatedOrder.orderNumber} has been cancelled.`,
        'If you have questions, reply to this email or contact support.',
      ],
    );

    return updatedOrder;
  }

  private async sendOrderEmail(
    userId: string,
    subject: string,
    lines: string[],
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (!user?.email) {
      return;
    }

    const greeting = user.firstName ? `Hi ${user.firstName},` : 'Hi there,';
    const closing = 'Thanks for shopping with Aura Commerce.';
    const htmlLines = [greeting, ...lines, closing]
      .map((line) => `<p>${line}</p>`)
      .join('');
    const text = [greeting, ...lines, closing].join('\n');

    try {
      await this.emailService.sendMail({
        to: user.email,
        subject,
        html: htmlLines,
        text,
      });
    } catch (error) {
      return;
    }
  }

  private formatLabel(value: string) {
    const normalized = value.toLowerCase().replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  private generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `AURA-${timestamp}-${random}`;
  }
}
