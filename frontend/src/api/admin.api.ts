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

export interface TopStore {
  id: string;
  name: string;
  avgRating: number;
  totalRatings: number;
}

export type ActivityType =
  | 'rating_submitted'
  | 'user_registered'
  | 'store_created';

export interface ActivityEvent {
  type: ActivityType;
  actorName: string | null;
  targetName: string | null;
  value: number | null;
  createdAt: string;
}

export interface AdminAnalytics {
  kpis: {
    totalUsers: number;
    totalStores: number;
    totalRatings: number;
    storesWithNoRatings: number;
  };
  ratingDistribution: Record<string, number>;
  topStores: TopStore[];
  recentActivity: ActivityEvent[];
}

/** GET /admin/analytics — KPIs, rating distribution, top stores, recent activity. */
export async function getAnalytics(): Promise<AdminAnalytics> {
  const { data } = await api.get<AdminAnalytics>('/admin/analytics');
  return data;
}
