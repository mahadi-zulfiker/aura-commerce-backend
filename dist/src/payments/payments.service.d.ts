import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class PaymentsService {
    private configService;
    private stripe;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number, currency?: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
}
