import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
export declare class PaymentsService {
    private configService;
    private prisma;
    private stripe;
    constructor(configService: ConfigService, prisma: PrismaService);
    createPaymentIntent(input: {
        amount: number;
        currency?: string;
        metadata?: Record<string, string>;
    }): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    createIntentForOrder(orderId: string, userId: string, isAdmin?: boolean): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    handleWebhook(payload: Buffer, signature?: string): Promise<{
        received: boolean;
    }>;
    refundPayment(orderId: string): Promise<Stripe.Response<Stripe.Refund>>;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private handleRefund;
}
