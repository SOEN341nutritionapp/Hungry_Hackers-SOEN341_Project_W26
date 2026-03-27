import { Type } from 'class-transformer'
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator'

export class UpdateFridgeItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  quantityDelta?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  availableAmount?: number
}
