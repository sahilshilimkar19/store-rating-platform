import axios from 'axios';
import { clearAuth, getToken } from '../utils/storage';

/** Shared axios instance pointed at the NestJS API. */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the Bearer token (if any) to every outgoing request.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid session), clear auth and bounce to /login.
// The login/register endpoints are exempt so their own 401s (bad credentials)
// surface to the page instead of triggering a redirect loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
