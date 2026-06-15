import api from './axios';

export interface AdminStats {
  total_users: number;
  total_stores: number;
  total_ratings: number;
}

/** GET /admin/stats — KPI counts for the admin dashboard. */
export async function getStats(): Promise<AdminStats> {
  const { data } = await api.get<AdminStats>('/admin/stats');
  return data;
}
