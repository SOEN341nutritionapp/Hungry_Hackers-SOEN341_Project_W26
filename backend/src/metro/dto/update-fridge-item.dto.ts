import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateFridgeItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantityDelta?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  availableAmount?: number;
}
