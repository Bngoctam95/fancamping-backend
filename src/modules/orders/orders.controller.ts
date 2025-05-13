import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from './enums/order-status.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { Types } from 'mongoose';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { Order } from './schemas/order.schema';

interface RequestWithUser extends Request {
  user: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
  };
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(
    @Request() req: RequestWithUser,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.create(
      req.user._id.toString(),
      createOrderDto,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo đơn hàng thành công',
      data: order,
    };
  }

  @Get()
  async findAll(
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<Order[]>> {
    const orders = await this.ordersService.findAll(req.user._id.toString());

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders,
    };
  }

  @Get(':id')
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.findOne(req.user._id.toString(), id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
    };
  }

  @Put(':id/pick-up')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsPickedUp(@Param('id') id: string): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.updateOrderStatus(
      id,
      OrderStatus.PICKED_UP,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  @Put(':id/in-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsInProgress(@Param('id') id: string): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.updateOrderStatus(
      id,
      OrderStatus.IN_PROGRESS,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  @Put(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsCompleted(@Param('id') id: string): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.updateOrderStatus(
      id,
      OrderStatus.COMPLETED,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái đơn hàng thành công',
      data: order,
    };
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsCancelled(@Param('id') id: string): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.updateOrderStatus(
      id,
      OrderStatus.CANCELLED,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Hủy đơn hàng thành công',
      data: order,
    };
  }

  @Put(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<ApiResponse<Order>> {
    const order = await this.ordersService.updatePaymentStatus(
      id,
      updatePaymentStatusDto.status,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái thanh toán thành công',
      data: order,
    };
  }
}
