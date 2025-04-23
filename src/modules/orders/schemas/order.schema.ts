import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
    ORDER_PLACED = 'Order Placed',
    PICKED_UP = 'Picked Up',
    IN_PROGRESS = 'In Progress',
    COMPLETED = 'Completed',
    CANCELLED = 'Cancelled',
    EXPIRED = 'Expired',
}

@Schema({ timestamps: true })
export class Order {
    _id: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop([
        {
            productId: { type: Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
        },
    ])
    items: Array<{
        productId: Types.ObjectId;
        quantity: number;
    }>;

    @Prop({ required: true })
    startDate: Date;

    @Prop({ required: true })
    endDate: Date;

    @Prop({ required: true })
    amount: number;

    @Prop({
        type: String,
        enum: OrderStatus,
        default: OrderStatus.ORDER_PLACED,
    })
    status: OrderStatus;

    @Prop()
    notes: string;

    @Prop({ type: Date })
    actualReturnDate: Date;

    @Prop({ type: Number, default: 0 })
    lateFee: number;

    @Prop({ type: String })
    lateFeeReason: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Tạo index cho các trường thường dùng để tìm kiếm
OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ startDate: 1, endDate: 1 });
