import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserRole } from './enums/user-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedUsers,
  UserQueryParams,
} from './interfaces/user-query.interface';
import * as bcrypt from 'bcrypt';
import { USERS_MESSAGE_KEYS } from './constants/message-keys';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException({
        message: 'Email already exists',
        message_key: USERS_MESSAGE_KEYS.EMAIL_ALREADY_EXISTS,
      });
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Tạo user mới với password đã hash
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      // Lưu user và trả về kết quả (loại bỏ password)
      const savedUser = await newUser.save();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, refreshToken, ...userWithoutSensitiveInfo } =
        savedUser.toObject();
      return userWithoutSensitiveInfo as Omit<
        User,
        'password' | 'refreshToken'
      >;
    } catch {
      throw new BadRequestException({
        message: 'Could not create user',
        message_key: USERS_MESSAGE_KEYS.USER_CREATE_FAILED,
      });
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user)
      throw new NotFoundException({
        message: 'User not found',
        message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user)
      throw new NotFoundException({
        message: 'User not found',
        message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    return user;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    // Kiểm tra nếu có email mới và email đã tồn tại
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id }, // Không tính user hiện tại
      });

      if (existingUser) {
        throw new ConflictException({
          message: 'Email already exists',
          message_key: USERS_MESSAGE_KEYS.EMAIL_ALREADY_EXISTS,
        });
      }
    }

    // Nếu có cập nhật mật khẩu, hash mật khẩu mới
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .select('-password -refreshToken')
        .exec();

      if (!user)
        throw new NotFoundException({
          message: 'User not found',
          message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
        });

      return user as Omit<User, 'password' | 'refreshToken'>;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException({
        message: 'Could not update user',
        message_key: USERS_MESSAGE_KEYS.USER_UPDATE_FAILED,
      });
    }
  }

  async remove(id: string): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException({
        message: 'User not found',
        message_key: USERS_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    }
    return result;
  }

  async findAllWithFilters(
    currentUserRole: UserRole,
    queryParams: UserQueryParams,
  ): Promise<PaginatedUsers> {
    const { page = 1, limit = 10, search, name, email, role, isActive, sort } = queryParams;
    const skip = (page - 1) * limit;

    // Xây dựng các điều kiện filter dựa theo role người dùng
    const roleFilter: FilterQuery<UserDocument> = {};

    // Filter theo role của người gọi API
    if (currentUserRole === UserRole.MOD) {
      // MOD chỉ được xem USER thường
      roleFilter.role = UserRole.USER;
    } else if (currentUserRole === UserRole.ADMIN) {
      // ADMIN được xem MOD và USER thường, không xem SUPER_ADMIN và ADMIN khác
      roleFilter.role = { $in: [UserRole.MOD, UserRole.USER] };
    }
    // SUPER_ADMIN không cần filter role, có thể xem tất cả

    // Xây dựng query dựa trên các tham số tìm kiếm
    const query: FilterQuery<UserDocument> = { ...roleFilter };

    // Áp dụng filter role nếu được chỉ định và phù hợp với quyền
    if (role) {
      // Kiểm tra xem người dùng có quyền xem role được chỉ định không
      if (
        (currentUserRole === UserRole.MOD && role !== UserRole.USER) ||
        (currentUserRole === UserRole.ADMIN &&
          [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(role))
      ) {
        // Nếu không có quyền, trả về mảng rỗng
        return {
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
      query.role = role;
    }

    // Áp dụng filter theo trạng thái hoạt động
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    // Áp dụng tìm kiếm theo name hoặc email cụ thể nếu có
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (email) {
      query.email = { $regex: email, $options: 'i' };
    }

    // Áp dụng tìm kiếm chung nếu có
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Xác định cách sắp xếp
    let sortOptions: any = { createdAt: -1 }; // Mặc định sắp xếp theo createdAt giảm dần
    if (sort) {
      const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
      const sortOrder = sort.startsWith('-') ? -1 : 1;

      // Chỉ cho phép sắp xếp theo name và createdAt
      if (['name', 'createdAt'].includes(sortField)) {
        sortOptions = { [sortField]: sortOrder };
      }
    }

    // Thực hiện truy vấn đếm tổng số
    const total = await this.userModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Thực hiện truy vấn lấy dữ liệu với phân trang và sắp xếp
    const users = await this.userModel
      .find(query)
      .select('-password -refreshToken')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .exec();

    return {
      items: users,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
