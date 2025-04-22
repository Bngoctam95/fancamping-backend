import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
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
      const { password, ...userWithoutPassword } = savedUser.toObject();
      return userWithoutPassword as Omit<User, 'password'>;
    } catch (error) {
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

  async update(id: string, updateUserDto: any): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async remove(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
