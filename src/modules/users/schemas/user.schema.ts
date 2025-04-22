import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MOD = 'mod',
  USER = 'user'
}

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  refreshToken: string;

  @Prop({ default: null })
  phone: string;

  @Prop({ default: null })
  avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
