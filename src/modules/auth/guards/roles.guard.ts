import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../users/enums/user-role.enum';
import { Request } from 'express';

interface RequestUser {
  role: UserRole;
}

interface AuthenticatedRequest extends Request {
  user: RequestUser;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request>() as AuthenticatedRequest;
    if (!request.user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.SUPER_ADMIN]: 4,
      [UserRole.ADMIN]: 3,
      [UserRole.MOD]: 2,
      [UserRole.USER]: 1,
    };

    const userRoleLevel = roleHierarchy[request.user.role];

    return requiredRoles.some((role) => userRoleLevel >= roleHierarchy[role]);
  }
}
