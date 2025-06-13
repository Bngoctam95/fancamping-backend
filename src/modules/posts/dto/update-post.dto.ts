import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subTitle?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsObject()
  @IsOptional()
  content?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(['blog', 'article'])
  @IsOptional()
  type?: 'blog' | 'article';

  @IsMongoId()
  @IsOptional()
  categoryId?: Types.ObjectId;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEnum(['draft', 'published', 'archived'])
  @IsOptional()
  status?: 'draft' | 'published' | 'archived';
}
