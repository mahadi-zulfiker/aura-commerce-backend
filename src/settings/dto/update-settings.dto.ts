import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  shippingThreshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  baseShippingCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  returnWindowDays?: number;
}
