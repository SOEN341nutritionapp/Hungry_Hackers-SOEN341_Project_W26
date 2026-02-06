import { IsOptional, IsString, IsNumber, IsArray, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences?: string[];
}
