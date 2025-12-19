import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPaymentIntent(body: {
        amount: number;
    }): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.PaymentIntent>>;
}
