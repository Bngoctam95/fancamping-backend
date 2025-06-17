import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminService } from './admin.service';
import { MulterModule } from '@nestjs/platform-express';
import { UploadService } from './services/upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MulterModule.register({
      dest: './uploads/users',
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, AdminService, UploadService],
  exports: [UsersService, AdminService],
})
export class UsersModule {}
