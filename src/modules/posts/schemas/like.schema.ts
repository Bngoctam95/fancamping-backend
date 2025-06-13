import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LikeDocument = Like & Document;

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true, enum: ['post', 'comment'] })
  targetType: 'post' | 'comment';
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Indexes
LikeSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });
LikeSchema.index({ targetId: 1, targetType: 1 });
