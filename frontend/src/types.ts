export type Role = 'admin' | 'normal' | 'store_owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  address?: string | null;
}
