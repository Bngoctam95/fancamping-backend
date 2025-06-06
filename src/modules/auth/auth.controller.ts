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

const REFRESH_TOKEN_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/auth/refresh',
};

const ACCESS_TOKEN_COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== 'development',
  sameSite: 'strict' as const,
  maxAge: 24 * 60 * 60 * 1000, // 1 day
  path: '/',
};

@Controller('auth')
export class AuthController {
  /* eslint-disable */
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() userData: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const result = await this.authService.register(userData);

    res.cookie(
      'refresh_token',
      (result.data as any).refresh_token,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );

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

    // Set both tokens in cookies
    res.cookie(
      'refresh_token',
      (result.data as any).refresh_token,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );
    res.cookie(
      'access_token',
      (result.data as any).access_token,
      ACCESS_TOKEN_COOKIE_CONFIG,
    );

    // Remove tokens from response data
    delete (result.data as any).refresh_token;
    delete (result.data as any).access_token;

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const result = await this.authService.logout(req.user._id.toString());

    // Clear both token cookies
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    res.clearCookie('access_token', { path: '/' });

    return result;
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<ApiResponse<any>> {
    const refreshToken = req.user.refreshToken;
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const result = await this.authService.refreshTokens(
      req.user._id.toString(),
      refreshToken,
    );

    // Set both new tokens in cookies
    res.cookie(
      'refresh_token',
      result.data.refresh_token,
      REFRESH_TOKEN_COOKIE_CONFIG,
    );
    res.cookie(
      'access_token',
      result.data.access_token,
      ACCESS_TOKEN_COOKIE_CONFIG,
    );

    // Remove tokens from response data
    delete (result.data as any).refresh_token;
    delete (result.data as any).access_token;

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<ApiResponse<any>> {
    return this.authService.getUserDetails(req.user._id.toString());
  }
}
