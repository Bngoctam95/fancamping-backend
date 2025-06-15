import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  subTitle?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;

  @IsObject()
  content: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(['blog', 'article'])
  type: 'blog' | 'article';

  @IsMongoId()
  categoryId: Types.ObjectId;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEnum(['draft', 'pending', 'published', 'archived'])
  @IsOptional()
  status?: 'draft' | 'pending' | 'published' | 'archived';
}
