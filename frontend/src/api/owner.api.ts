import api from './axios';

export interface Rater {
  user_id: string;
  name: string;
  email: string;
  submitted_value: number;
  submitted_at: string;
}

export interface OwnerDashboard {
  avg_rating: number | null;
  raters: Rater[];
}

/** GET /store-owner/dashboard — average rating + list of raters for the owned store. */
export async function getOwnerDashboard(): Promise<OwnerDashboard> {
  const { data } = await api.get<OwnerDashboard>('/store-owner/dashboard');
  return data;
}
