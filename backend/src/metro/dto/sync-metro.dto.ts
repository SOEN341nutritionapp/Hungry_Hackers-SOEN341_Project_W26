import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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
  @IsInt()
  @Min(1)
  unitFactor?: number;
}

export class SyncMetroDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncMetroItemDto)
  items!: SyncMetroItemDto[];
}
