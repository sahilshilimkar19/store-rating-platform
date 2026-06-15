import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { Rating } from './entities/rating.entity';

/** Message required when a user tries to rate a store they have already rated. */
const ALREADY_RATED_MESSAGE =
  'You have already rated this store. Use PATCH to update.';

/** Postgres unique_violation error code. */
const PG_UNIQUE_VIOLATION = '23505';

export interface RatingView {
  id: string;
  store_id: string;
  user_id: string;
  value: number;
  created_at: Date;
  updated_at: Date;
}

export interface OwnerDashboard {
  avg_rating: number | null;
  raters: Array<{
    user_id: string;
    name: string;
    email: string;
    submitted_value: number;
    submitted_at: Date;
  }>;
}

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  /** Normal user submits a rating for a store (one per user per store). */
  async create(userId: string, dto: CreateRatingDto): Promise<RatingView> {
    const store = await this.storeRepository.findOne({
      where: { id: dto.store_id },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Fast-path duplicate check for a friendly message...
    const existing = await this.ratingRepository
      .createQueryBuilder('rating')
      .where('rating.user_id = :userId AND rating.store_id = :storeId', {
        userId,
        storeId: dto.store_id,
      })
      .getOne();
    if (existing) {
      throw new ConflictException(ALREADY_RATED_MESSAGE);
    }

    const rating = this.ratingRepository.create({
      value: dto.value,
      user: { id: userId } as User,
      store: { id: dto.store_id } as Store,
    });

    try {
      const saved = await this.ratingRepository.save(rating);
      return this.toView(saved, userId, dto.store_id);
    } catch (err) {
      // ...and a safety net for the race between the check above and insert,
      // backed by the UNIQUE(user_id, store_id) constraint.
      if (
        err instanceof QueryFailedError &&
        (err.driverError as { code?: string })?.code === PG_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(ALREADY_RATED_MESSAGE);
      }
      throw err;
    }
  }

  /** Normal user updates their OWN rating. */
  async update(
    userId: string,
    ratingId: string,
    dto: UpdateRatingDto,
  ): Promise<RatingView> {
    const rating = await this.ratingRepository.findOne({
      where: { id: ratingId },
      relations: { user: true, store: true },
    });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }
    if (rating.user.id !== userId) {
      throw new ForbiddenException('You can only update your own rating');
    }

    rating.value = dto.value;
    const saved = await this.ratingRepository.save(rating);
    return this.toView(saved, rating.user.id, rating.store.id);
  }

  /**
   * Store owner dashboard: average rating and the list of raters for the
   * store(s) owned by the calling user.
   */
  async getOwnerDashboard(userId: string): Promise<OwnerDashboard> {
    const owned = await this.storeRepository
      .createQueryBuilder('store')
      .select('store.id', 'id')
      .where('store.owner_id = :userId', { userId })
      .getRawMany<{ id: string }>();
    const storeIds = owned.map((o) => o.id);

    if (storeIds.length === 0) {
      return { avg_rating: null, raters: [] };
    }

    const avgRaw = await this.ratingRepository
      .createQueryBuilder('rating')
      .where('rating.store_id IN (:...storeIds)', { storeIds })
      .select('ROUND(AVG(rating.value), 2)', 'avg')
      .getRawOne<{ avg: string | null }>();
    const avg_rating =
      avgRaw && avgRaw.avg != null ? Number(avgRaw.avg) : null;

    const rows = await this.ratingRepository
      .createQueryBuilder('rating')
      .innerJoin('rating.user', 'u')
      .where('rating.store_id IN (:...storeIds)', { storeIds })
      .select('u.id', 'user_id')
      .addSelect('u.name', 'name')
      .addSelect('u.email', 'email')
      .addSelect('rating.value', 'submitted_value')
      .addSelect('rating.created_at', 'submitted_at')
      .orderBy('rating.created_at', 'DESC')
      .getRawMany<{
        user_id: string;
        name: string;
        email: string;
        submitted_value: number;
        submitted_at: Date;
      }>();

    return {
      avg_rating,
      raters: rows.map((row) => ({
        user_id: row.user_id,
        name: row.name,
        email: row.email,
        submitted_value: Number(row.submitted_value),
        submitted_at: row.submitted_at,
      })),
    };
  }

  private toView(
    rating: Rating,
    userId: string,
    storeId: string,
  ): RatingView {
    return {
      id: rating.id,
      store_id: storeId,
      user_id: userId,
      value: rating.value,
      created_at: rating.createdAt,
      updated_at: rating.updatedAt,
    };
  }
}
