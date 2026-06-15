import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export type SortOrder = 'asc' | 'desc';

/** Columns the admin user list may be sorted by (whitelisted to prevent injection). */
export const USER_SORTABLE_FIELDS = ['name', 'email', 'address', 'role'] as const;
export type UserSortField = (typeof USER_SORTABLE_FIELDS)[number];

/**
 * Query parameters for GET /users: optional partial-match filters, a whitelisted
 * sort field/order, and pagination. Defaults applied via ValidationPipe transform.
 */
export class UserFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(Role, { message: 'Role must be one of: admin, normal, store_owner' })
  role?: Role;

  @IsOptional()
  @IsIn(USER_SORTABLE_FIELDS)
  sortBy: UserSortField = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: SortOrder = 'asc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
