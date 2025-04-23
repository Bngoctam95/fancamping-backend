import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  order: number;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Tạo index
CategorySchema.index({ name: 'text', slug: 'text' });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ order: 1 });
