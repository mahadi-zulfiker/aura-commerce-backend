import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateReturnItemDto } from './create-return-item.dto';

export class CreateReturnDto {
  @IsString()
  orderId: string;

  @IsString()
  @MinLength(3)
  reason: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items?: CreateReturnItemDto[];
}
