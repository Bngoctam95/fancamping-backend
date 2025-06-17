import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop()
  subTitle: string;

  @Prop()
  thumbnail: string;

  @Prop({ type: Object, required: true })
  content: Record<string, any>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, enum: ['blog', 'article'] })
  type: 'blog' | 'article';

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ default: false })
  published: boolean;

  @Prop()
  publishedAt: Date;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ required: true })
  slug: string;

  @Prop({
    default: 'draft',
    enum: ['draft', 'pending', 'published', 'archived', 'rejected'],
  })
  status: 'draft' | 'pending' | 'published' | 'archived' | 'rejected';

  @Prop()
  rejectionReason?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Indexes
PostSchema.index({ type: 1, published: 1 });
PostSchema.index({ authorId: 1 });
PostSchema.index({ categoryId: 1 });
PostSchema.index({ slug: 1 }, { unique: true });
PostSchema.index({ type: 1, published: 1, publishedAt: 1 });
