import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createDefaultAdmin() {
    try {
      // Check if super admin already exists
      const superAdminExists = await this.userModel.findOne({
        role: UserRole.SUPER_ADMIN,
      });

      if (!superAdminExists) {
        // Create super admin
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const superAdmin = new this.userModel({
          name: 'Super Admin',
          email: 'superadmin@gmail.com',
          password: hashedPassword,
          role: UserRole.SUPER_ADMIN,
          isActive: true,
          phone: '0123456789',
          avatar: null,
        });

        await superAdmin.save();
      }
    } catch (error) {
      console.error('Error creating default super admin:', error);
    }
  }
}
