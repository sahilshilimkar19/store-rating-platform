import api from './axios';

export interface RatingView {
  id: string;
  store_id: string;
  user_id: string;
  value: number;
  created_at: string;
  updated_at: string;
}

/** POST /ratings — submit a new rating for a store. */
export async function submitRating(payload: {
  store_id: string;
  value: number;
}): Promise<RatingView> {
  const { data } = await api.post<RatingView>('/ratings', payload);
  return data;
}

/** PATCH /ratings/:id — update the caller's existing rating. */
export async function updateRating(
  id: string,
  value: number,
): Promise<RatingView> {
  const { data } = await api.patch<RatingView>(`/ratings/${id}`, { value });
  return data;
}
