import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateOrderTrackingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  carrier?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  trackingNumber?: string;
}
