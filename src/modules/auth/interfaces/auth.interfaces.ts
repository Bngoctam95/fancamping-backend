import { Types } from 'mongoose';
import { UserRole } from '../../users/schemas/user.schema';

export interface User {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  refreshToken?: string;
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

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}
