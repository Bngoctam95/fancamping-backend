import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
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

  @IsString()
  @Matches(/^(\+84|0)\d{9}$/, {
    message: 'Phone number must start with +84 or 0 and have 9 digits after',
  })
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
