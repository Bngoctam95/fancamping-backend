import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
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

interface RequestWithUser extends Request {
  user: {
    _id: Types.ObjectId;
    userId: string;
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
  ) {
    return this.ordersService.create(req.user.userId, createOrderDto);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser) {
    return this.ordersService.findAll(req.user.userId);
  }

  @Get(':id')
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.ordersService.findOne(req.user.userId, id);
  }

  @Put(':id/pick-up')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsPickedUp(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, OrderStatus.PICKED_UP);
  }

  @Put(':id/in-progress')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsInProgress(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, OrderStatus.IN_PROGRESS);
  }

  @Put(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsCompleted(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, OrderStatus.COMPLETED);
  }

  @Put(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsCancelled(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, OrderStatus.CANCELLED);
  }

  @Put(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(
      id,
      updatePaymentStatusDto.status,
    );
  }
}
