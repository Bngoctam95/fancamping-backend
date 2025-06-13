import { IsString, IsOptional, IsMongoId, IsNumber } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  parentId?: Types.ObjectId;

  @IsNumber()
  @IsOptional()
  order?: number;
}
