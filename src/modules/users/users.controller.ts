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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @Roles(UserRole.MOD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    const currentUser = req.user;

    // Kiểm tra quyền tạo user dựa vào role
    if (createUserDto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot create SUPER_ADMIN account');
    }

    if (createUserDto.role === UserRole.ADMIN) {
      if (currentUser.role !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Only SUPER_ADMIN can create ADMIN accounts');
      }
    }

    if (createUserDto.role === UserRole.MOD) {
      if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(currentUser.role)) {
        throw new ForbiddenException('Only SUPER_ADMIN and ADMIN can create MOD accounts');
      }
    }

    // Mặc định role là USER nếu không được chỉ định
    if (!createUserDto.role) {
      createUserDto.role = UserRole.USER;
    }

    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: any) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
