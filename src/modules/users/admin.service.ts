import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createDefaultAdmin() {
    try {
      // Check if admin already exists
      const adminExists = await this.userModel.findOne({ role: 'admin' });

      if (!adminExists) {
        // Create admin
        const hashedPassword = await bcrypt.hash('admin123', 10);

        const admin = new this.userModel({
          name: 'Admin',
          email: 'admin@gmail.com',
          password: hashedPassword,
          role: 'admin',
          isActive: true,
        });

        await admin.save();
        console.log('Default admin created successfully');
      }
    } catch (error) {
      console.error('Error creating default admin:', error);
    }
  }
}
