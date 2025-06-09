import { Type } from 'class-transformer';
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
import { ProductStatus } from '../schemas/product.schema';

class InventoryDto {
  @IsNumber()
  @IsOptional()
  @Min(0)
  total?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  available?: number;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  slider?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => InventoryDto)
  inventory?: InventoryDto;

  @IsMongoId()
  @IsOptional()
  categoryId?: string;

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
