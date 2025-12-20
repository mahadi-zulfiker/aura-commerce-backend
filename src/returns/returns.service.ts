import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReturnStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { SettingsService } from '../settings/settings.service';
import { restoreOrderInventory } from '../utils/order-inventory';
import { CreateReturnDto } from './dto/create-return.dto';

@Injectable()
export class ReturnsService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private settingsService: SettingsService,
  ) {}

  async createReturnRequest(userId: string, dto: CreateReturnDto) {
    const settings = await this.settingsService.getSettings();
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        shop: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.orderStatus !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'Returns are available only after delivery',
      );
    }

    if (!order.deliveredAt) {
      throw new BadRequestException('Order delivery date is missing');
    }

    const returnDeadline = new Date(order.deliveredAt);
    returnDeadline.setDate(returnDeadline.getDate() + settings.returnWindowDays);
    if (new Date() > returnDeadline) {
      throw new BadRequestException('Return window has expired');
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: {
          in: [
            ReturnStatus.REQUESTED,
            ReturnStatus.APPROVED,
            ReturnStatus.RECEIVED,
          ],
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Return already in progress');
    }

    const orderItems = new Map(
      order.items.map((item) => [item.id, item]),
    );

    const requestedItems =
      dto.items && dto.items.length
        ? dto.items
        : order.items.map((item) => ({
            orderItemId: item.id,
            quantity: item.quantity,
          }));

    const returnItems: Prisma.ReturnItemCreateManyInput[] = [];
    for (const item of requestedItems) {
      const orderItem = orderItems.get(item.orderItemId);
      if (!orderItem) {
        throw new BadRequestException('Invalid return item');
      }
      if (item.quantity > orderItem.quantity) {
        throw new BadRequestException(
          `Return quantity exceeds ordered quantity for ${orderItem.productName}`,
        );
      }
      returnItems.push({
        orderItemId: orderItem.id,
        quantity: item.quantity,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.returnRequest.create({
        data: {
          orderId: order.id,
          userId,
          reason: dto.reason,
          note: dto.note,
        },
      });

      await tx.returnItem.createMany({
        data: returnItems.map((item) => ({
          ...item,
          returnRequestId: request.id,
        })),
      });

      return tx.returnRequest.findUnique({
        where: { id: request.id },
        include: {
          order: {
            include: {
              items: true,
              shop: true,
            },
          },
          items: {
            include: { orderItem: true },
          },
        },
      });
    });
  }

  async listReturns(userId: string, role: UserRole, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: Prisma.ReturnRequestWhereInput = {};

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

      where.order = { is: { shopId: shop.id } };
    }

    const [returns, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              items: true,
              shop: true,
            },
          },
          items: {
            include: { orderItem: true },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      data: returns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReturn(userId: string, role: UserRole, returnId: string) {
    const request = await this.prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: {
          include: {
            items: true,
            shop: true,
          },
        },
        items: {
          include: { orderItem: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Return request not found');
    }

    if (role === UserRole.USER && request.userId !== userId) {
      throw new NotFoundException('Return request not found');
    }

    if (role === UserRole.VENDOR) {
      const shop = await this.prisma.shop.findUnique({
        where: { vendorId: userId },
      });
      if (!shop || request.order.shopId !== shop.id) {
        throw new NotFoundException('Return request not found');
      }
    }

    return request;
  }

  async updateStatus(
    userId: string,
    role: UserRole,
    returnId: string,
    status: ReturnStatus,
  ) {
    const request = await this.getReturn(userId, role, returnId);

    if (
      request.status === ReturnStatus.CANCELLED ||
      request.status === ReturnStatus.REFUNDED
    ) {
      throw new BadRequestException('Return request is closed');
    }

    const now = new Date();
    const data: Prisma.ReturnRequestUpdateInput = {
      status,
    };

    if (status === ReturnStatus.APPROVED) {
      data.approvedAt = now;
    } else if (status === ReturnStatus.REJECTED) {
      data.rejectedAt = now;
    } else if (status === ReturnStatus.RECEIVED) {
      data.receivedAt = now;
    } else if (status === ReturnStatus.REFUNDED) {
      if (
        request.order.paymentMethod === PaymentMethod.CARD &&
        request.order.paymentStatus === PaymentStatus.PAID
      ) {
        await this.paymentsService.refundPayment(request.orderId);
      } else {
        await restoreOrderInventory(
          this.prisma,
          request.order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            sku: item.sku,
            variantInfo: item.variantInfo,
          })),
        );

        await this.prisma.order.update({
          where: { id: request.orderId },
          data: {
            paymentStatus: PaymentStatus.REFUNDED,
            orderStatus: OrderStatus.REFUNDED,
            cancelledAt: now,
          },
        });
      }
      data.refundedAt = now;
    } else if (status === ReturnStatus.CANCELLED) {
      data.cancelledAt = now;
    }

    return this.prisma.returnRequest.update({
      where: { id: request.id },
      data,
      include: {
        order: {
          include: {
            items: true,
            shop: true,
          },
        },
        items: {
          include: { orderItem: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async cancelReturn(userId: string, returnId: string) {
    const request = await this.getReturn(userId, UserRole.USER, returnId);

    if (request.status !== ReturnStatus.REQUESTED) {
      throw new BadRequestException('Return request cannot be cancelled');
    }

    return this.prisma.returnRequest.update({
      where: { id: request.id },
      data: {
        status: ReturnStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }
}
