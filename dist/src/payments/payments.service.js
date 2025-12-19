"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../database/prisma.service");
let PaymentsService = class PaymentsService {
    configService;
    prisma;
    stripe;
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        const secretKey = this.configService.get('stripe.secretKey');
        if (!secretKey) {
            throw new Error('Stripe secret key is not set');
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2025-12-15.clover',
        });
    }
    async createPaymentIntent(input) {
        return this.stripe.paymentIntents.create({
            amount: Math.round(input.amount * 100),
            currency: input.currency ?? 'usd',
            metadata: input.metadata,
            automatic_payment_methods: {
                enabled: true,
            },
        });
    }
    async createIntentForOrder(orderId, userId, isAdmin = false) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.BadRequestException('Order not found');
        }
        if (!isAdmin && order.userId !== userId) {
            throw new common_1.BadRequestException('Order not found');
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
    async handleWebhook(payload, signature) {
        const webhookSecret = this.configService.get('stripe.webhookSecret');
        if (!signature || !webhookSecret) {
            throw new common_1.BadRequestException('Missing Stripe signature');
        }
        const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
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
    async refundPayment(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order || !order.stripePaymentId) {
            throw new common_1.BadRequestException('Order is not eligible for refund');
        }
        const refund = await this.stripe.refunds.create({
            payment_intent: order.stripePaymentId,
        });
        await this.prisma.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: client_1.PaymentStatus.REFUNDED,
                orderStatus: client_1.OrderStatus.REFUNDED,
            },
        });
        return refund;
    }
    async handlePaymentSucceeded(paymentIntent) {
        const latestCharge = paymentIntent.latest_charge;
        const transactionId = typeof latestCharge === 'string'
            ? latestCharge
            : (latestCharge?.id ?? null);
        await this.prisma.order.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: {
                paymentStatus: client_1.PaymentStatus.PAID,
                orderStatus: client_1.OrderStatus.CONFIRMED,
                paidAt: new Date(),
                transactionId,
            },
        });
    }
    async handlePaymentFailed(paymentIntent) {
        await this.prisma.order.updateMany({
            where: { stripePaymentId: paymentIntent.id },
            data: {
                paymentStatus: client_1.PaymentStatus.FAILED,
                orderStatus: client_1.OrderStatus.CANCELLED,
                cancelledAt: new Date(),
            },
        });
    }
    async handleRefund(charge) {
        const paymentIntentId = typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;
        if (!paymentIntentId) {
            return;
        }
        await this.prisma.order.updateMany({
            where: { stripePaymentId: paymentIntentId },
            data: {
                paymentStatus: client_1.PaymentStatus.REFUNDED,
                orderStatus: client_1.OrderStatus.REFUNDED,
                cancelledAt: new Date(),
            },
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map