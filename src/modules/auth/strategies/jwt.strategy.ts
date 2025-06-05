import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';

interface JwtPayload {
  email: string;
  _id: string;
  role: string;
  iat: number;
  exp: number;
}

// Helper function to extract JWT from cookie or Authorization header
const extractJwtFromRequest = (req: Request): string | null => {
  // 1. Try to get from cookie
  if (req?.cookies?.access_token) {
    return req.cookies.access_token as string;
  }

  // 2. Try to get from Authorization header (for backward compatibility)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }
    super({
      jwtFromRequest: extractJwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload._id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
  }
}
