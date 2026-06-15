import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import {
  clearAuth,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../utils/storage';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

/**
 * Holds the authenticated user + token, initialized from localStorage so the
 * session survives reloads, and keeps both in sync on login/logout.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setStoredUser(newUser);
    setTokenState(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isAuthenticated: !!token, login, logout }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
