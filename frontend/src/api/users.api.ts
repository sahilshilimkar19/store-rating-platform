import type { Role, User } from '../types';
import { cleanParams } from '../utils/params';
import api from './axios';

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: Role;
  createdAt: string;
}

export interface PaginatedUsers {
  data: UserListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: Role;
  /** Present only for store owners. */
  avgRating?: number | null;
}

export interface ListUsersParams {
  name?: string;
  email?: string;
  address?: string;
  role?: Role;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  address?: string;
  role: Role;
}

export interface StoreOwnerOption {
  id: string;
  name: string;
  email: string;
}

/** GET /users — paginated admin + normal users. */
export async function listUsers(
  params: ListUsersParams,
): Promise<PaginatedUsers> {
  const { data } = await api.get<PaginatedUsers>('/users', {
    params: cleanParams(params),
  });
  return data;
}

/** GET /users/:id — user detail (avgRating for store owners). */
export async function getUser(id: string): Promise<UserDetail> {
  const { data } = await api.get<UserDetail>(`/users/${id}`);
  return data;
}

/** POST /users — create a user of any role. */
export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await api.post<User>('/users', payload);
  return data;
}

/** GET /users/store-owners — for the store-owner picker. */
export async function listStoreOwners(): Promise<StoreOwnerOption[]> {
  const { data } = await api.get<StoreOwnerOption[]>('/users/store-owners');
  return data;
}
