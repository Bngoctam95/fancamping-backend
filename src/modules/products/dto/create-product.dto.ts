import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  Min,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductStatus } from '../schemas/product.schema';

class PricingDto {
  @IsNumber()
  @Min(0)
  regular: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  weekend?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  deposit?: number;
}

class InventoryDto {
  @IsNumber()
  @Min(0)
  total: number;

  @IsNumber()
  @Min(0)
  available: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  thumbnail: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  slider?: string[];

  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ValidateNested()
  @Type(() => InventoryDto)
  inventory: InventoryDto;

  @IsMongoId()
  categoryId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
