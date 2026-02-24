import {
  IsString,
  IsNotEmpty,
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

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  stock: number;

  @IsEnum(ProductType)
  type: ProductType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
