import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { SettingsModule } from '../settings/settings.module';
import { EmailService } from '../utils/email.service';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';

@Module({
  imports: [PaymentsModule, SettingsModule],
  controllers: [ReturnsController],
  providers: [ReturnsService, EmailService],
})
export class ReturnsModule {}
