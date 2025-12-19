import { UserRole } from '@prisma/client';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPaymentIntent(dto: CreatePaymentIntentDto, req: {
        user: {
            id: string;
            role: UserRole;
        };
    }): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.PaymentIntent>>;
    refundPayment(dto: RefundPaymentDto): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.Refund>>;
    handleWebhook(req: {
        body: Buffer;
    }, signature?: string): Promise<{
        received: boolean;
    }>;
}
