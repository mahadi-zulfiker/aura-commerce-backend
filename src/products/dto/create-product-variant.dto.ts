import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  name: string;

  @IsString()
  sku: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  price?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;
}
