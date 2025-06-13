import { IsString, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';

export class CreateCommentDto {
  @IsMongoId()
  postId: Types.ObjectId;

  @IsString()
  content: string;

  @IsMongoId()
  @IsOptional()
  parentId?: Types.ObjectId;
}
