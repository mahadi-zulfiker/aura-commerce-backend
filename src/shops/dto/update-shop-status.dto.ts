import { IsEnum } from 'class-validator';
import { ShopStatus } from '@prisma/client';

export class UpdateShopStatusDto {
  @IsEnum(ShopStatus)
  status: ShopStatus;
}
