import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

export enum ProductStatus {
  AVAILABLE = 'available',
  LIMITED = 'limited',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

@Schema({ timestamps: true })
export class Product {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  shortDescription: string;

  @Prop({ required: true })
  thumbnail: string;

  @Prop({ type: [String], default: [] })
  slider: string[];

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({
    type: {
      total: Number,
      available: Number,
    },
    required: true,
  })
  inventory: {
    total: number;
    available: number;
  };

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    default: { average: 0, count: 0 },
  })
  ratings: {
    average: number;
    count: number;
  };

  @Prop({
    type: String,
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: ProductStatus;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Tạo index cho các trường thường dùng để tìm kiếm
ProductSchema.index({ name: 'text', slug: 'text', tags: 'text' });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ status: 1 });
