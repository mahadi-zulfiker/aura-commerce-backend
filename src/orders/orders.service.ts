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
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
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
            if (variant.stock < item.quantity) {
              throw new BadRequestException(
                `Insufficient stock for ${product.name}`,
              );
            }
            if (product.stock < item.quantity) {
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

            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { decrement: item.quantity } },
            });
          } else if (product.stock < item.quantity) {
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

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
        }

        const shippingCost = subtotalAccumulator >= 100 ? 0 : 9.99;
        const taxAmount = 0;
        let discountAmount = 0;
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
        }

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
          },
        });
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

    return this.prisma.order.update({
      where: { id: order.id },
      data: {
        orderStatus: status,
        ...paymentStatusUpdate,
        ...timestampData,
      },
    });
  }

  private generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `AURA-${timestamp}-${random}`;
  }
}
