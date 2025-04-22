import { Types } from 'mongoose';

export interface User {
  _id: string | Types.ObjectId;
  email: string;
  name: string;
  role: string;
  refreshToken?: string;
  password?: string;
}

export interface UserPayload {
  email: string;
  _id: string | Types.ObjectId;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends TokenResponse {
  user: Omit<User, 'password' | 'refreshToken'>;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}
