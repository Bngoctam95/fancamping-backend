import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import {
  LoginResponse,
  TokenResponse,
  RegisterDto,
  User,
} from './interfaces/auth.interfaces';
import { UserRole } from '../users/schemas/user.schema';

// Interface định nghĩa kiểu dữ liệu RequestWithUser
interface RequestWithUser extends Request {
  user: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
    name?: string;
    refreshToken?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(@Body() userData: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(userData);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: RequestWithUser): Promise<LoginResponse> {
    if (!req.user) {
      throw new UnauthorizedException('No user from auth guard');
    }
    if (!req.user.name) {
      throw new UnauthorizedException('User name is required');
    }
    return this.authService.login(req.user as unknown as User);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: RequestWithUser): Promise<{ message: string }> {
    return this.authService.logout(req.user._id.toString());
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@Request() req: RequestWithUser): Promise<TokenResponse> {
    const userId = req.user._id.toString();
    const refreshToken = req.user.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: RequestWithUser): Promise<Omit<User, 'password' | 'refreshToken'>> {
    return this.authService.getUserDetails(req.user._id.toString());
  }
}
