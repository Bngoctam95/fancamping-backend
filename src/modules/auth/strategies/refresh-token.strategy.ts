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

// Hàm helper để extract JWT từ nhiều nguồn khác nhau
const extractJwtFromRequest = (req: Request): string | null => {
  // 1. Try to get from cookie
  if (req?.cookies?.refresh_token) {
    return req.cookies.refresh_token as string;
  }

  // 2. Try to get from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 3. Try to get from body
  const body = req.body as { refresh_token?: string };
  if (body?.refresh_token) {
    return body.refresh_token;
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
      jwtFromRequest: extractJwtFromRequest,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = extractJwtFromRequest(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    // Thêm kiểm tra người dùng
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
