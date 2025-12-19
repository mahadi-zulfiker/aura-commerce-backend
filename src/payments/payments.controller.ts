import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @Req() req: { user: { id: string; role: UserRole } },
  ) {
    const isAdmin = req.user.role === UserRole.ADMIN;
    return this.paymentsService.createIntentForOrder(
      dto.orderId,
      req.user.id,
      isAdmin,
    );
  }

  @Post('refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  refundPayment(@Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(dto.orderId);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Req() req: { body: Buffer },
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(req.body, signature);
  }
}
