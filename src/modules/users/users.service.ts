import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  PaginatedUsers,
  UserQueryParams,
} from './interfaces/user-query.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
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
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword as Omit<User, 'password'>;
    } catch {
      throw new BadRequestException('Could not create user');
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !!user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Kiểm tra nếu có email mới và email đã tồn tại
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id }, // Không tính user hiện tại
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Nếu có cập nhật mật khẩu, hash mật khẩu mới
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const user = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .select('-password')
        .exec();

      if (!user) throw new NotFoundException('User not found');
      return user;
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException('Could not update user');
    }
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllWithFilters(
    currentUserRole: UserRole,
    queryParams: UserQueryParams,
  ): Promise<PaginatedUsers> {
    const { page = 1, limit = 10, search, role, isActive } = queryParams;
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

    // Áp dụng tìm kiếm nếu có
    if (search) {
      // Tìm kiếm theo name hoặc email
      query.$or = [
        { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Thực hiện truy vấn đếm tổng số
    const total = await this.userModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Thực hiện truy vấn lấy dữ liệu với phân trang và sắp xếp
    const users = await this.userModel
      .find(query)
      .select('-password -refreshToken') // Không lấy mật khẩu và refreshToken
      .sort({ createdAt: -1 }) // Sắp xếp mới nhất trước
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
