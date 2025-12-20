import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type CheckoutSettings = {
  shippingThreshold: number;
  baseShippingCost: number;
  taxRate: number;
  returnWindowDays: number;
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    const existing = await this.prisma.storeSettings.findFirst();
    if (existing) {
      return existing;
    }

    return this.prisma.storeSettings.create({
      data: {},
    });
  }

  async getCheckoutSettings(): Promise<CheckoutSettings> {
    const settings = await this.getSettings();
    return {
      shippingThreshold: settings.shippingThreshold,
      baseShippingCost: settings.baseShippingCost,
      taxRate: settings.taxRate,
      returnWindowDays: settings.returnWindowDays,
    };
  }

  async updateSettings(values: Partial<CheckoutSettings>) {
    const settings = await this.getSettings();
    return this.prisma.storeSettings.update({
      where: { id: settings.id },
      data: values,
    });
  }
}
