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
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  UserQueryParams,
  PaginatedUsers,
} from './interfaces/user-query.interface';
import { Request as ExpressRequest } from 'express';
import { Types } from 'mongoose';
import { ApiResponse } from '../../interfaces/api-response.interface';
import { User } from './schemas/user.schema';

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
  ): Promise<ApiResponse<Omit<User, 'password' | 'refreshToken'>>> {
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

    const userData = await this.usersService.create(createUserDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Tạo người dùng thành công',
      data: userData,
    };
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
  ): Promise<ApiResponse<PaginatedUsers>> {
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
    const users = await this.usersService.findAllWithFilters(
      currentUser.role,
      queryParams,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách người dùng thành công',
      data: users,
    };
  }

  @Get('me')
  async getProfile(
    @Request() req: RequestWithUser,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
    const userId = req.user._id.toString();
    const user = await this.usersService.findOne(userId);

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin người dùng thành công',
      data: user,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MOD)
  async findOne(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
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

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin người dùng thành công',
      data: userToView,
    };
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
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

    const updatedUser = await this.usersService.update(id, updateUserDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUser,
    };
  }

  @Delete(':id')
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
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

    const deletedUser = await this.usersService.remove(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa người dùng thành công',
      data: deletedUser,
    };
  }
}
