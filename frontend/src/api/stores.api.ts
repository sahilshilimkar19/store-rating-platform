import { cleanParams } from '../utils/params';
import api from './axios';

export interface AdminStoreItem {
  id: string;
  name: string;
  email: string;
  address: string | null;
  created_at: string;
  overall_rating: number | null;
  owner_id: string | null;
  owner_name: string | null;
}

/** Paginated listing envelope returned by the store endpoints. */
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListStoresParams {
  name?: string;
  email?: string;
  address?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateStorePayload {
  name: string;
  email: string;
  address?: string;
  owner_id?: string;
}

/** Store row as seen by a Normal User (includes their own rating + its id). */
export interface UserStoreItem {
  id: string;
  name: string;
  email: string;
  address: string | null;
  overall_rating: number | null;
  user_rating: number | null;
  user_rating_id: string | null;
}

export interface SearchStoresParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/** GET /stores — paginated list for normal users (with overall + own rating). */
export async function listStores(
  params: SearchStoresParams = {},
): Promise<Paginated<UserStoreItem>> {
  const { data } = await api.get<Paginated<UserStoreItem>>('/stores', {
    params: cleanParams(params),
  });
  return data;
}

/** GET /admin/stores — paginated admin store listing with overall_rating. */
export async function listAdminStores(
  params: ListStoresParams,
): Promise<Paginated<AdminStoreItem>> {
  const { data } = await api.get<Paginated<AdminStoreItem>>('/admin/stores', {
    params: cleanParams(params),
  });
  return data;
}

/** POST /stores — create a store, optionally owned by a store_owner. */
export async function createStore(
  payload: CreateStorePayload,
): Promise<unknown> {
  const { data } = await api.post('/stores', payload);
  return data;
}
