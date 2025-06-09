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
import { USERS_MESSAGE_KEYS } from './constants/message-keys';
import { COMMON_MESSAGE_KEYS } from '../../constants/common-message-keys';

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
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(UserRole.MOD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Request() req: RequestWithUser,
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<Omit<User, 'password' | 'refreshToken'>>> {
    const currentUser = req.user;

    // Kiểm tra quyền tạo user dựa vào role
    if (createUserDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        message: 'Cannot create SUPER_ADMIN account',
        message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
      });
    }

    if (createUserDto.role === UserRole.ADMIN) {
      if (currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException({
          message: 'Only SUPER_ADMIN can create ADMIN accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    if (createUserDto.role === UserRole.MOD) {
      if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
        throw new ForbiddenException({
          message: 'Only SUPER_ADMIN and ADMIN can create MOD accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
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
      message_key: USERS_MESSAGE_KEYS.USER_CREATED,
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
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('sort') sort?: string,
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
      name,
      email,
      role,
      isActive: isActiveValue,
      sort,
    };

    // Lấy danh sách user với filter theo role
    const users = await this.usersService.findAllWithFilters(
      currentUser.role,
      queryParams,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách người dùng thành công',
      message_key: USERS_MESSAGE_KEYS.USER_FETCH_ALL_SUCCESS,
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
      message_key: USERS_MESSAGE_KEYS.USER_FETCH_SUCCESS,
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
      throw new NotFoundException({
        message: 'User not found',
        message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    }

    // Kiểm tra quyền xem thông tin user
    if (currentUser.role === UserRole.MOD) {
      // MOD chỉ được xem thông tin USER thường
      if (userToView.role !== UserRole.USER) {
        throw new ForbiddenException({
          message: 'MOD can only view regular USER accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    } else if (currentUser.role === UserRole.ADMIN) {
      // ADMIN không được xem thông tin SUPER_ADMIN
      if (userToView.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException({
          message: 'ADMIN cannot view SUPER_ADMIN accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Lấy thông tin người dùng thành công',
      message_key: USERS_MESSAGE_KEYS.USER_FETCH_SUCCESS,
      data: userToView,
    };
  }

  @Put(':id')
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponse<Omit<User, 'password' | 'refreshToken'>>> {
    const currentUser = req.user;
    const userToUpdate = await this.usersService.findOne(id);

    if (!userToUpdate) {
      throw new NotFoundException({
        message: 'User not found',
        message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    }

    // Kiểm tra quyền cập nhật user
    // 1. User thường chỉ có thể cập nhật thông tin cá nhân của mình
    if (
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MOD].includes(
        currentUser.role,
      )
    ) {
      if (currentUser._id.toString() !== id) {
        throw new ForbiddenException({
          message: 'You can only update your own account',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    // 2. MOD chỉ có thể cập nhật thông tin USER thường, không thể cập nhật role
    if (currentUser.role === UserRole.MOD) {
      if (userToUpdate.role !== UserRole.USER) {
        throw new ForbiddenException({
          message: 'MOD can only update regular USER accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }

      if (updateUserDto.role) {
        throw new ForbiddenException({
          message: 'MOD cannot update user roles',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    // 3. ADMIN có thể cập nhật thông tin USER và MOD, không thể cập nhật ADMIN khác và SUPER_ADMIN
    if (currentUser.role === UserRole.ADMIN) {
      if (
        [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userToUpdate.role) &&
        currentUser._id.toString() !== id
      ) {
        throw new ForbiddenException({
          message: 'ADMIN cannot update other ADMIN or SUPER_ADMIN accounts',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }

      // ADMIN có thể đề xuất USER lên MOD, nhưng không thể tạo ADMIN hoặc SUPER_ADMIN
      if (
        updateUserDto.role === UserRole.ADMIN ||
        updateUserDto.role === UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException({
          message: 'ADMIN cannot promote users to ADMIN or SUPER_ADMIN',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    // 4. SUPER_ADMIN có thể cập nhật mọi tài khoản, nhưng không thể để người khác trở thành SUPER_ADMIN
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (
        updateUserDto.role === UserRole.SUPER_ADMIN &&
        currentUser._id.toString() !== id
      ) {
        throw new ForbiddenException({
          message: 'Cannot promote other users to SUPER_ADMIN role',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);

    return {
      statusCode: HttpStatus.OK,
      message: 'Cập nhật thông tin người dùng thành công',
      message_key: USERS_MESSAGE_KEYS.USER_UPDATED,
      data: updatedUser,
    };
  }

  @Delete(':id')
  async remove(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ApiResponse<{ acknowledged: boolean; deletedCount: number } | null>> {
    const currentUser = req.user;

    // Nếu không phải là ADMIN/SUPER_ADMIN thì chỉ được xóa tài khoản của chính mình
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role)) {
      if (currentUser._id.toString() !== id) {
        throw new ForbiddenException({
          message: 'You can only delete your own account',
          message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
        });
      }
    }

    // Kiểm tra user cần xóa
    const userToDelete = await this.usersService.findOne(id);

    // Không ai được xóa SUPER_ADMIN
    if (userToDelete.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException({
        message: 'Cannot delete SUPER_ADMIN account',
        message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
      });
    }

    // ADMIN không thể xóa ADMIN khác
    if (
      currentUser.role === UserRole.ADMIN &&
      userToDelete.role === UserRole.ADMIN
    ) {
      throw new ForbiddenException({
        message: 'ADMIN cannot delete other ADMIN accounts',
        message_key: COMMON_MESSAGE_KEYS.FORBIDDEN,
      });
    }

    // Xóa user và trả về kết quả xóa
    const result = await this.usersService.remove(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Xóa người dùng thành công',
      message_key: USERS_MESSAGE_KEYS.USER_DELETED,
      data: result,
    };
  }
}
