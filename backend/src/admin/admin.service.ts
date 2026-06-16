import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from '../ratings/entities/rating.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';

export interface AdminStats {
  total_users: number;
  total_stores: number;
  total_ratings: number;
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

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  /** KPI counts for the admin dashboard cards. */
  async getStats(): Promise<AdminStats> {
    const [total_users, total_stores, total_ratings] = await Promise.all([
      this.userRepository.count(),
      this.storeRepository.count(),
      this.ratingRepository.count(),
    ]);
    return { total_users, total_stores, total_ratings };
  }

  /**
   * Rich analytics for the admin dashboard: KPIs, rating distribution, the
   * top-rated stores, and a recent-activity feed. Computed with aggregate
   * queries — nothing is denormalized.
   */
  async getAnalytics(): Promise<AdminAnalytics> {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      this.userRepository.count(),
      this.storeRepository.count(),
      this.ratingRepository.count(),
    ]);

    // Stores that have never been rated.
    const ratedRow = await this.ratingRepository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.store_id)', 'c')
      .getRawOne<{ c: string }>();
    const storesWithNoRatings = totalStores - Number(ratedRow?.c ?? 0);

    // Rating distribution (fill 1..5, defaulting missing buckets to 0).
    const distRows = await this.ratingRepository
      .createQueryBuilder('r')
      .select('r.value', 'value')
      .addSelect('COUNT(*)', 'count')
      .groupBy('r.value')
      .getRawMany<{ value: number; count: string }>();
    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };
    for (const row of distRows) {
      ratingDistribution[String(row.value)] = Number(row.count);
    }

    // Top 5 stores by average rating, requiring at least 3 ratings.
    const topRows = await this.storeRepository
      .createQueryBuilder('s')
      .innerJoin('s.ratings', 'r')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('ROUND(AVG(r.value), 2)', 'avgRating')
      .addSelect('COUNT(r.id)', 'totalRatings')
      .groupBy('s.id')
      .addGroupBy('s.name')
      .having('COUNT(r.id) >= 3')
      .orderBy('AVG(r.value)', 'DESC')
      .addOrderBy('COUNT(r.id)', 'DESC')
      .limit(5)
      .getRawMany<{
        id: string;
        name: string;
        avgRating: string;
        totalRatings: string;
      }>();
    const topStores: TopStore[] = topRows.map((row) => ({
      id: row.id,
      name: row.name,
      avgRating: Number(row.avgRating),
      totalRatings: Number(row.totalRatings),
    }));

    const recentActivity = await this.getRecentActivity();

    return {
      kpis: { totalUsers, totalStores, totalRatings, storesWithNoRatings },
      ratingDistribution,
      topStores,
      recentActivity,
    };
  }

  /** Last 10 events across ratings, registrations, and store creations. */
  private async getRecentActivity(): Promise<ActivityEvent[]> {
    const [ratingRows, userRows, storeRows] = await Promise.all([
      this.ratingRepository
        .createQueryBuilder('r')
        .innerJoin('r.user', 'u')
        .innerJoin('r.store', 's')
        .select('u.name', 'actorName')
        .addSelect('s.name', 'targetName')
        .addSelect('r.value', 'value')
        .addSelect('r.createdAt', 'createdAt')
        .orderBy('r.createdAt', 'DESC')
        .limit(10)
        .getRawMany<{
          actorName: string;
          targetName: string;
          value: number;
          createdAt: Date;
        }>(),
      this.userRepository
        .createQueryBuilder('u')
        .select('u.name', 'actorName')
        .addSelect('u.createdAt', 'createdAt')
        .orderBy('u.createdAt', 'DESC')
        .limit(10)
        .getRawMany<{ actorName: string; createdAt: Date }>(),
      this.storeRepository
        .createQueryBuilder('s')
        .select('s.name', 'targetName')
        .addSelect('s.createdAt', 'createdAt')
        .orderBy('s.createdAt', 'DESC')
        .limit(10)
        .getRawMany<{ targetName: string; createdAt: Date }>(),
    ]);

    const events: ActivityEvent[] = [
      ...ratingRows.map((r) => ({
        type: 'rating_submitted' as const,
        actorName: r.actorName,
        targetName: r.targetName,
        value: Number(r.value),
        createdAt: new Date(r.createdAt).toISOString(),
      })),
      ...userRows.map((u) => ({
        type: 'user_registered' as const,
        actorName: u.actorName,
        targetName: null,
        value: null,
        createdAt: new Date(u.createdAt).toISOString(),
      })),
      ...storeRows.map((s) => ({
        type: 'store_created' as const,
        actorName: null,
        targetName: s.targetName,
        value: null,
        createdAt: new Date(s.createdAt).toISOString(),
      })),
    ];

    return events
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10);
  }
}
