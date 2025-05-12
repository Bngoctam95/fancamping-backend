import { Types } from 'mongoose';
import { UserRole } from '../../users/enums/user-role.enum';

export interface User {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  refreshToken?: string;
  isActive?: boolean;
  phone?: string;
  avatar?: string;
}

export interface UserPayload {
  _id: Types.ObjectId;
  email: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: Omit<User, 'password' | 'refreshToken'>;
}

// Response trả về cho client (không có refresh_token)
export interface LoginResponseWithoutRefreshToken {
  access_token: string;
  user: Omit<User, 'password' | 'refreshToken'>;
}

// Response cho endpoint refresh
export interface AccessTokenResponse {
  access_token: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
}
