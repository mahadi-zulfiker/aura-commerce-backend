import { IsInt, IsString, Min } from 'class-validator';

export class CreateReturnItemDto {
  @IsString()
  orderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
