import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  ForbiddenException,
  Request,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserQueryParams,
  PaginatedUsers,
} from './interfaces/user-query.interface';
import { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';

// Interface cho Request với thông tin user
interface RequestWithUser extends ExpressRequest {
  user: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.MOD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Request() req: RequestWithUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    const currentUser = req.user;

    // Kiểm tra quyền tạo user dựa vào role
    if (createUserDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot create SUPER_ADMIN account');
    }

    if (createUserDto.role === UserRole.ADMIN) {
      if (currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only SUPER_ADMIN can create ADMIN accounts',
        );
      }
    }

    if (createUserDto.role === UserRole.MOD) {
      if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
        throw new ForbiddenException(
          'Only SUPER_ADMIN and ADMIN can create MOD accounts',
        );
      }
    }

    // Mặc định role là USER nếu không được chỉ định
    if (!createUserDto.role) {
      createUserDto.role = UserRole.USER;
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MOD)
  async findAll(
    @Request() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ): Promise<PaginatedUsers> {
    const currentUser = req.user;

    // Parse isActive query param
    let isActiveValue: boolean | undefined = undefined;
    if (isActive === 'true') isActiveValue = true;
    else if (isActive === 'false') isActiveValue = false;

    // Parse query params
    const queryParams: UserQueryParams = {
      page: +page, // Convert to number
      limit: +limit, // Convert to number
      search,
      role,
      isActive: isActiveValue,
    };

    // Lấy danh sách user với filter theo role
    return await this.usersService.findAllWithFilters(
      currentUser.role,
      queryParams,
    );
  }

  @Get('me')
  async getProfile(@Request() req: RequestWithUser) {
    const userId = req.user._id.toString();
    return this.usersService.findOne(userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MOD)
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    const currentUser = req.user;
    const userToView = await this.usersService.findOne(id);

    if (!userToView) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra quyền xem thông tin user
    if (currentUser.role === UserRole.MOD) {
      // MOD chỉ được xem thông tin USER thường
      if (userToView.role !== UserRole.USER) {
        throw new ForbiddenException('MOD can only view regular USER accounts');
      }
    } else if (currentUser.role === UserRole.ADMIN) {
      // ADMIN không được xem thông tin SUPER_ADMIN
      if (userToView.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('ADMIN cannot view SUPER_ADMIN accounts');
      }
    }

    return userToView;
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const currentUser = req.user;
    const userToUpdate = await this.usersService.findOne(id);

    if (!userToUpdate) {
      throw new NotFoundException('User not found');
    }

    // Kiểm tra quyền cập nhật user
    // 1. User thường chỉ có thể cập nhật thông tin cá nhân của mình
    if (
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MOD].includes(
        currentUser.role,
      )
    ) {
      if (currentUser._id.toString() !== id) {
        throw new ForbiddenException('You can only update your own account');
      }
    }

    // 2. MOD chỉ có thể cập nhật thông tin USER thường, không thể cập nhật role
    if (currentUser.role === UserRole.MOD) {
      if (userToUpdate.role !== UserRole.USER) {
        throw new ForbiddenException(
          'MOD can only update regular USER accounts',
        );
      }

      if (updateUserDto.role) {
        throw new ForbiddenException('MOD cannot update user roles');
      }
    }

    // 3. ADMIN có thể cập nhật thông tin USER và MOD, không thể cập nhật ADMIN khác và SUPER_ADMIN
    if (currentUser.role === UserRole.ADMIN) {
      if (
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userToUpdate.role) &&
        currentUser._id.toString() !== id
      ) {
        throw new ForbiddenException(
          'ADMIN cannot update other ADMIN or SUPER_ADMIN accounts',
        );
      }

      // ADMIN có thể đề xuất USER lên MOD, nhưng không thể tạo ADMIN hoặc SUPER_ADMIN
      if (
        updateUserDto.role === UserRole.ADMIN ||
        updateUserDto.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'ADMIN cannot promote users to ADMIN or SUPER_ADMIN',
        );
      }
    }

    // 4. SUPER_ADMIN có thể cập nhật mọi tài khoản, nhưng không thể để người khác trở thành SUPER_ADMIN
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (
        updateUserDto.role === UserRole.SUPER_ADMIN &&
        currentUser._id.toString() !== id
      ) {
        throw new ForbiddenException(
          'Cannot promote other users to SUPER_ADMIN role',
        );
      }
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    const currentUser = req.user;

    // Nếu không phải là ADMIN/SUPER_ADMIN thì chỉ được xóa tài khoản của chính mình
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role)) {
      if (currentUser._id.toString() !== id) {
        throw new ForbiddenException('You can only delete your own account');
      }
    }

    // Kiểm tra user cần xóa
    const userToDelete = await this.usersService.findOne(id);

    // Không ai được xóa SUPER_ADMIN
    if (userToDelete.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete SUPER_ADMIN account');
    }

    // ADMIN không thể xóa ADMIN khác
    if (
      currentUser.role === UserRole.ADMIN &&
      userToDelete.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException('ADMIN cannot delete other ADMIN accounts');
    }

    return this.usersService.remove(id);
  }
}
