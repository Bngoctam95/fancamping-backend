import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

interface JwtPayload {
  email: string;
  _id: string;
  role: string;
  iat: number;
  exp: number;
}

// Hàm helper để extract JWT từ cookie
const extractJwtFromCookie = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['refresh_token'] as string;
  }
  return null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret =
      configService.get<string>('JWT_REFRESH_SECRET') ||
      configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }

    super({
      jwtFromRequest: extractJwtFromCookie, // Sử dụng hàm extract JWT từ cookie
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.cookies['refresh_token'] as string;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Thêm kiểm tra người dùng (không bắt buộc nhưng giúp thêm await)
    const user = await this.usersService.findOne(payload._id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
