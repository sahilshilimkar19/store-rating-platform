import { IsIn, IsOptional, IsString } from 'class-validator';
import { SortOrder } from '../../users/dto/user-filter.dto';

/** Columns the store listings may be sorted by (whitelisted to prevent injection). */
export const STORE_SORTABLE_FIELDS = [
  'name',
  'email',
  'address',
  'rating',
] as const;
export type StoreSortField = (typeof STORE_SORTABLE_FIELDS)[number];

/**
 * Query parameters for the store listings: partial-match search on name/address
 * plus whitelisted sort field/order. 'rating' sorts by the computed overall_rating.
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

  @IsOptional()
  @IsIn(STORE_SORTABLE_FIELDS)
  sortBy: StoreSortField = 'name';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: SortOrder = 'asc';
}
