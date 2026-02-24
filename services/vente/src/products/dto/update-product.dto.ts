import {
  IsString,
  IsNumber,
  IsInt,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType } from '../entities/product.entity';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  price?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  stock?: number;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
