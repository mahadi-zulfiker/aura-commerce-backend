import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      throw new Error('Stripe secret key is not set');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  async createPaymentIntent(input: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) {
    return this.stripe.paymentIntents.create({
      amount: Math.round(input.amount * 100),
      currency: input.currency ?? 'usd',
      metadata: input.metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async createIntentForOrder(orderId: string, userId: string, isAdmin = false) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new BadRequestException('Order not found');
    }

    const intent = await this.createPaymentIntent({
      amount: order.total,
      currency: 'usd',
      metadata: { orderId, userId: order.userId },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentId: intent.id },
    });

    return intent;
  }

  async handleWebhook(payload: Buffer, signature?: string) {
    const webhookSecret = this.configService.get<string>(
      'stripe.webhookSecret',
    );
    if (!signature || !webhookSecret) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.refunded':
        await this.handleRefund(event.data.object);
        break;
      default:
        break;
    }

    return { received: true };
  }

  async refundPayment(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || !order.stripePaymentId) {
      throw new BadRequestException('Order is not eligible for refund');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: order.stripePaymentId,
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        orderStatus: OrderStatus.REFUNDED,
      },
    });

    return refund;
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const latestCharge = paymentIntent.latest_charge;
    const transactionId =
      typeof latestCharge === 'string'
        ? latestCharge
        : (latestCharge?.id ?? null);

    await this.prisma.order.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        orderStatus: OrderStatus.CONFIRMED,
        paidAt: new Date(),
        transactionId,
      },
    });
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    await this.prisma.order.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        orderStatus: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  private async handleRefund(charge: Stripe.Charge) {
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      return;
    }

    await this.prisma.order.updateMany({
      where: { stripePaymentId: paymentIntentId },
      data: {
        paymentStatus: PaymentStatus.REFUNDED,
        orderStatus: OrderStatus.REFUNDED,
        cancelledAt: new Date(),
      },
    });
  }
}
