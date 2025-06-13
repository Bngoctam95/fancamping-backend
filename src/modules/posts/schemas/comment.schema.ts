import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ default: 'active', enum: ['active', 'hidden', 'deleted'] })
  status: 'active' | 'hidden' | 'deleted';

  @Prop({ default: 0 })
  likeCount: number;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

// Indexes
CommentSchema.index({ postId: 1, status: 1 });
CommentSchema.index({ parentId: 1 });
