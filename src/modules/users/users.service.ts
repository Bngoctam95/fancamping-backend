import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async create(createUserDto: any): Promise<User> {
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
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
        const user = await this.userModel.findByIdAndDelete(id).select('-password').exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }
} 