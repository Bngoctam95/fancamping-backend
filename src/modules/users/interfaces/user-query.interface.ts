import { User } from '../schemas/user.schema';
import { UserRole } from '../enums/user-role.enum';

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
