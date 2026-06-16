import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { SortOrder } from '../../users/dto/user-filter.dto';

/**
 * Columns the store listings may be sorted by (whitelisted to prevent injection).
 * 'rating'/'overall_rating' sort by the computed average; 'user_rating' is only
 * meaningful for a Normal User listing and is ignored otherwise.
 */
export const STORE_SORTABLE_FIELDS = [
  'name',
  'email',
  'address',
  'rating',
  'overall_rating',
  'user_rating',
] as const;
export type StoreSortField = (typeof STORE_SORTABLE_FIELDS)[number];

/**
 * Query parameters for the store listings: partial-match filters (or a combined
 * `search` over name + address), whitelisted sort field/order, and pagination.
 * Defaults are applied by the global ValidationPipe transform.
 */
export class StoreFilterDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  /** Combined partial match over name OR address (single search box). */
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(STORE_SORTABLE_FIELDS)
  sortBy: StoreSortField = 'name';

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
