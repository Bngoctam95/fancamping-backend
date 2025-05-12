import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Get,
  UnauthorizedException,
  Res,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { RegisterDto, User } from './interfaces/auth.interfaces';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiResponse } from '../../interfaces/api-response.interface';

// Interface định nghĩa kiểu dữ liệu RequestWithUser
interface RequestWithUser extends Request {
  user: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
    name?: string;
    refreshToken?: string;
  };
  cookies?: {
    refresh_token?: string;
  };
}

interface RequestWithCookies extends Request {
  cookies: {
    refresh_token?: string;
  };
}

// Cấu hình cookie
const REFRESH_TOKEN_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development', // true trong production
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: '/auth/refresh',
};

@Controller('auth')
export class AuthController {
  /* eslint-disable */
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() userData: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const result = await this.authService.register(userData);

    // Đặt refresh token vào cookie
    res.cookie(
      'refresh_token',
      (result.data as any).refresh_token,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );

    // Xóa refresh_token từ response data
    delete (result.data as any).refresh_token;

    return result;
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    if (!req.user) {
      throw new UnauthorizedException('No user from auth guard');
    }
    if (!req.user.name) {
      throw new UnauthorizedException('User name is required');
    }

    const result = await this.authService.login(req.user as unknown as User);

    // Đặt refresh token vào cookie
    res.cookie(
      'refresh_token',
      (result.data as any).refresh_token,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );

    // Xóa refresh_token từ response data
    delete (result.data as any).refresh_token;

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const result = await this.authService.logout(req.user._id.toString());

    // Xóa cookie refresh token
    res.clearCookie('refresh_token', { path: '/auth/refresh' });

    return result;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(
    @Request() req: RequestWithUser & RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const refreshToken = req.cookies?.refresh_token || req.user.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refreshTokens(req.user._id.toString(), refreshToken);

    // Đặt refresh token mới vào cookie nếu có
    if ((result.data as any).refresh_token) {
      res.cookie(
        'refresh_token',
        (result.data as any).refresh_token,
        REFRESH_TOKEN_COOKIE_CONFIG,
      );

      // Xóa refresh_token từ response data
      delete (result.data as any).refresh_token;
    }

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<ApiResponse<any>> {
    return this.authService.getUserDetails(req.user._id.toString());
  }
}
