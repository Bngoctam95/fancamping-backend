import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
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
import { UserRole } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
    };

    return userResponse;
  }

  async login(user: User): Promise<LoginResponse> {
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

    const response: LoginResponse = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };

    return response;
  }

  async register(userData: RegisterDto): Promise<LoginResponse> {
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

      // Return token and user information
      return this.login(user as User);
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
  ): Promise<TokenResponse> {
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

      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    try {
      // Xóa refresh token khỏi database
      await this.usersService.update(userId, { refreshToken: null });
      return { message: 'Logged out successfully' };
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
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
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
      };

      return userInfo;
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
