import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        // Validate dates
        const startDate = new Date(createOrderDto.startDate);
        const endDate = new Date(createOrderDto.endDate);

        if (startDate >= endDate) {
            throw new BadRequestException('End date must be after start date');
        }

        if (startDate < new Date()) {
            throw new BadRequestException('Start date cannot be in the past');
        }

        // Calculate rental days
        const days = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Validate products and calculate total amount
        let totalAmount = 0;
        const productIds = createOrderDto.items.map(
            (item) => new Types.ObjectId(item.productId),
        );

        const products = await this.productModel.find({
            _id: { $in: productIds },
            isActive: true,
        });

        if (products.length !== createOrderDto.items.length) {
            throw new BadRequestException(
                'One or more products not found or inactive',
            );
        }

        // Check inventory and calculate amount
        for (const item of createOrderDto.items) {
            const product = products.find((p) => p._id.toString() === item.productId);

            if (!product) {
                throw new BadRequestException(`Product not found: ${item.productId}`);
            }

            if (item.quantity > product.inventory.available) {
                throw new BadRequestException(
                    `Not enough inventory for product: ${product.name}`,
                );
            }

            totalAmount += product.price * item.quantity * days;
        }

        // Create order
        const order = new this.orderModel({
            userId: new Types.ObjectId(userId),
            items: createOrderDto.items.map((item) => ({
                productId: new Types.ObjectId(item.productId),
                quantity: item.quantity,
            })),
            startDate,
            endDate,
            amount: totalAmount,
            notes: createOrderDto.notes,
        });

        // Save order and update inventory
        const savedOrder = await order.save();

        // Update product inventory
        await Promise.all(
            createOrderDto.items.map((item) =>
                this.productModel.updateOne(
                    { _id: new Types.ObjectId(item.productId) },
                    { $inc: { 'inventory.available': -item.quantity } },
                ),
            ),
        );

        return savedOrder;
    }

    async findAll(userId: string): Promise<Order[]> {
        return this.orderModel
            .find({ userId: new Types.ObjectId(userId) })
            .populate('items.productId', 'name price')
            .sort({ createdAt: -1 })
            .exec();
    }

    async findOne(userId: string, orderId: string): Promise<Order> {
        const order = await this.orderModel
            .findOne({
                _id: new Types.ObjectId(orderId),
                userId: new Types.ObjectId(userId),
            })
            .populate('items.productId', 'name price')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async updateOrderStatus(
        orderId: string,
        status: OrderStatus,
    ): Promise<Order> {
        const order = await this.orderModel.findById(orderId);
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Validate status transition
        const validTransitions = new Map<OrderStatus, OrderStatus[]>([
            [OrderStatus.ORDER_PLACED, [OrderStatus.PICKED_UP, OrderStatus.CANCELLED]],
            [OrderStatus.PICKED_UP, [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED]],
            [OrderStatus.IN_PROGRESS, [OrderStatus.COMPLETED, OrderStatus.CANCELLED]],
            [OrderStatus.COMPLETED, []],
            [OrderStatus.CANCELLED, []],
            [OrderStatus.EXPIRED, []],
        ]);

        const allowedNextStatuses = validTransitions.get(order.status);
        if (!allowedNextStatuses?.includes(status)) {
            throw new BadRequestException(
                `Invalid status transition from ${order.status} to ${status}`,
            );
        }

        // If order is being completed or cancelled, update inventory
        if (status === OrderStatus.COMPLETED || status === OrderStatus.CANCELLED) {
            await this.updateInventory(order.items, status === OrderStatus.COMPLETED);
        }

        order.status = status;
        return order.save();
    }

    private async updateInventory(
        items: Array<{ productId: Types.ObjectId; quantity: number }>,
        isCompleted: boolean,
    ) {
        const updateOperation = isCompleted ? 1 : -1;

        await Promise.all(
            items.map((item) =>
                this.productModel.updateOne(
                    { _id: item.productId },
                    { $inc: { 'inventory.available': item.quantity * updateOperation } },
                ),
            ),
        );
    }

    async checkAndUpdateExpiredOrders(): Promise<void> {
        const now = new Date();
        const expiredOrders = await this.orderModel.find({
            endDate: { $lt: now },
            status: { $in: [OrderStatus.ORDER_PLACED, OrderStatus.IN_PROGRESS] },
        });

        for (const order of expiredOrders) {
            await this.updateOrderStatus(order._id.toString(), OrderStatus.EXPIRED);
        }
    }
}
