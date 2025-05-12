import { IsEmail, IsString, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
