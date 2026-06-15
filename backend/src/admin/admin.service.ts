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
}
