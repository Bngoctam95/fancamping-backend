import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  Get,
} from '@nestjs/common';
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

// Interface định nghĩa kiểu dữ liệu RequestWithUser
interface RequestWithUser extends Request {
  user: {
    _id: string;
    email: string;
    role: string;
    name?: string;
    refreshToken?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() userData: RegisterDto): Promise<LoginResponse> {
    return this.authService.register(userData);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: RequestWithUser): Promise<LoginResponse> {
    return this.authService.login(req.user as User);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: RequestWithUser): Promise<{ message: string }> {
    return this.authService.logout(req.user._id);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refreshTokens(@Request() req: RequestWithUser): Promise<TokenResponse> {
    const userId = req.user._id;
    const refreshToken = req.user.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    return this.authService.refreshTokens(userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('account')
  async getAccount(
    @Request() req: RequestWithUser,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const userId = req.user._id;
    return this.authService.getUserDetails(userId);
  }
}
