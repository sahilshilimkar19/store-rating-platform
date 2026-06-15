import type { User } from '../types';
import api from './axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  address?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

/** POST /auth/login — single login for all roles. */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);
  return data;
}

/** POST /auth/register — normal-user signup. Returns the created user (no token). */
export async function register(
  payload: RegisterPayload,
): Promise<{ user: User }> {
  const { data } = await api.post<{ user: User }>('/auth/register', payload);
  return data;
}

/** PATCH /auth/change-password — authenticated self-service password change. */
export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>(
    '/auth/change-password',
    payload,
  );
  return data;
}
