import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class SyncMetroItemDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  unitFactor?: number;

  @IsOptional()
  @IsString()
  sizeLabel?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class SyncMetroDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncMetroItemDto)
  items!: SyncMetroItemDto[];
}
