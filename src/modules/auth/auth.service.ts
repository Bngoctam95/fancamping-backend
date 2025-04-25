import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import {
  User,
  UserPayload,
  TokenResponse,
  LoginResponse,
  RegisterDto,
} from './interfaces/auth.interfaces';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiResponse } from '../../interfaces/api-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    /* eslint-disable */
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    if (!password) {
      throw new UnauthorizedException('Password is required');
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.password) {
      throw new UnauthorizedException('User password is not set');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Convert to User interface
    const userResponse: User = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      isActive: user.isActive,
    };

    return userResponse;
  }

  async login(
    user: User,
  ): Promise<ApiResponse<Omit<LoginResponse, 'refresh_token'>>> {
    if (!user || !user._id || !user.email || !user.role) {
      console.log('Invalid user data:', {
        id: user?._id,
        email: user?.email,
        role: user?.role,
        fullUser: user,
      });
      throw new UnauthorizedException('Invalid user data');
    }

    const payload: UserPayload = {
      email: user.email,
      _id: user._id,
      role: user.role,
    };

    // Tạo access token và refresh token
    const tokens = await this.getTokens(payload);

    // Lưu refresh token vào database
    await this.updateRefreshToken(user._id.toString(), tokens.refresh_token);

    // Lấy thông tin đầy đủ của user
    const userDetails = await this.usersService.findOne(user._id.toString());

    // Format lại response theo cấu trúc mới
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: {
        access_token: tokens.access_token,
        user: {
          _id: userDetails._id,
          email: userDetails.email,
          name: userDetails.name,
          role: userDetails.role,
          avatar: userDetails.avatar || undefined,
          phone: userDetails.phone || undefined,
          isActive: userDetails.isActive,
        },
      },
    };
  }

  async register(
    userData: RegisterDto,
  ): Promise<ApiResponse<Omit<LoginResponse, 'refresh_token'>>> {
    try {
      // Check if user already exists
      const emailExists = await this.usersService.checkEmailExists(
        userData.email,
      );
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create new user
      const user = await this.usersService.create({
        ...userData,
        password: hashedPassword,
        role: UserRole.USER,
      });

      // Đã có user, tạo token và format response
      const payload: UserPayload = {
        email: user.email,
        _id: user._id,
        role: user.role,
      };

      const tokens = await this.getTokens(payload);
      await this.updateRefreshToken(user._id.toString(), tokens.refresh_token);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'User registered successfully',
        data: {
          access_token: tokens.access_token,
          user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar || undefined,
            phone: user.phone || undefined,
            isActive: user.isActive,
          },
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new UnauthorizedException('Registration failed');
    }
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<ApiResponse<{ access_token: string }>> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Access Denied');
      }

      const payload: UserPayload = {
        email: user.email,
        _id: user._id,
        role: user.role,
      };

      const tokens = await this.getTokens(payload);
      await this.updateRefreshToken(user._id.toString(), tokens.refresh_token);

      return {
        statusCode: HttpStatus.OK,
        message: 'Token refreshed successfully',
        data: {
          access_token: tokens.access_token,
        },
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      // Xóa refresh token khỏi database
      await this.usersService.update(userId, { refreshToken: null });

      return {
        statusCode: HttpStatus.OK,
        message: 'Logged out successfully',
        data: {
          message: 'Logged out successfully',
        },
      };
    } catch {
      throw new BadRequestException('Logout failed');
    }
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    // Hash refresh token trước khi lưu vào database
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async getUserDetails(
    userId: string,
  ): Promise<ApiResponse<Omit<User, 'password' | 'refreshToken'>>> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Tạo đối tượng mới không bao gồm password và refreshToken
      const userInfo = {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || undefined,
        phone: user.phone || undefined,
        isActive: user.isActive,
      };

      return {
        statusCode: HttpStatus.OK,
        message: 'User details retrieved successfully',
        data: userInfo,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get user details');
    }
  }

  async getTokens(payload: UserPayload): Promise<TokenResponse> {
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '1d', // Access token có thời hạn ngắn
      }),
      this.jwtService.signAsync(payload, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          this.configService.get<string>('JWT_SECRET'), // Fallback nếu không có refresh secret
        expiresIn: '7d', // Refresh token có thời hạn dài hơn
      }),
    ]);

    return {
      access_token,
      refresh_token,
    };
  }
}
