import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreFilterDto } from './dto/store-filter.dto';
import { Store } from './entities/store.entity';

/** Context describing whose user_rating (if any) to attach to store rows. */
interface RatingContext {
  includeUserRating: boolean;
  userId?: string;
}

export interface StoreView {
  id: string;
  name: string;
  email: string;
  address: string | null;
  overall_rating: number | null;
  /** Present only when the caller is a Normal User. */
  user_rating?: number | null;
}

interface RawStoreRow {
  id: string;
  name: string;
  email: string;
  address: string | null;
  overall_rating: string | null;
  user_rating?: string | null;
}

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
    private readonly usersService: UsersService,
  ) {}

  /** Admin: create a store, optionally linked to a store_owner user account. */
  async createStore(dto: CreateStoreDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.storeRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('A store with this email already exists');
    }

    if (dto.owner_id) {
      const owner = await this.usersService.findById(dto.owner_id);
      if (!owner) {
        throw new BadRequestException(
          'owner_id does not reference an existing user',
        );
      }
      if (owner.role !== Role.STORE_OWNER) {
        throw new BadRequestException(
          'owner_id must reference a store_owner user',
        );
      }
    }

    const store = this.storeRepository.create({
      name: dto.name,
      email,
      address: dto.address ?? null,
      owner: dto.owner_id ? ({ id: dto.owner_id } as User) : null,
    });
    const saved = await this.storeRepository.save(store);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      address: saved.address,
      owner_id: dto.owner_id ?? null,
      createdAt: saved.createdAt,
    };
  }

  /** List stores with overall_rating (and user_rating for normal users). */
  async findAll(
    filter: StoreFilterDto,
    ctx: RatingContext,
  ): Promise<StoreView[]> {
    const qb = this.buildStoreQuery(ctx);

    if (filter.name) {
      qb.andWhere('store.name ILIKE :name', { name: `%${filter.name}%` });
    }
    if (filter.address) {
      qb.andWhere('store.address ILIKE :address', {
        address: `%${filter.address}%`,
      });
    }

    // sortBy is whitelisted by the DTO (@IsIn), so this map is injection-safe.
    // 'rating' orders by the computed overall_rating alias.
    const sortExprMap: Record<string, string> = {
      name: 'store.name',
      email: 'store.email',
      address: 'store.address',
      rating: 'overall_rating',
    };
    qb.orderBy(
      sortExprMap[filter.sortBy],
      filter.sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    const rows = await qb.getRawMany<RawStoreRow>();
    return rows.map((row) => this.mapRow(row, ctx.includeUserRating));
  }

  /** Single store detail with overall_rating (and user_rating for normal users). */
  async findOne(id: string, ctx: RatingContext): Promise<StoreView> {
    const row = await this.buildStoreQuery(ctx)
      .where('store.id = :id', { id })
      .getRawOne<RawStoreRow>();

    if (!row) {
      throw new NotFoundException('Store not found');
    }
    return this.mapRow(row, ctx.includeUserRating);
  }

  /**
   * Base query selecting store columns plus a correlated subquery for the
   * overall average rating, and optionally a second correlated subquery for the
   * calling user's own rating.
   */
  private buildStoreQuery(ctx: RatingContext): SelectQueryBuilder<Store> {
    const qb = this.storeRepository
      .createQueryBuilder('store')
      .select('store.id', 'id')
      .addSelect('store.name', 'name')
      .addSelect('store.email', 'email')
      .addSelect('store.address', 'address')
      .addSelect(
        (sub) =>
          sub
            .select('ROUND(AVG(r.value), 2)')
            .from(Rating, 'r')
            .where('r.store_id = store.id'),
        'overall_rating',
      );

    if (ctx.includeUserRating) {
      qb.addSelect(
        (sub) =>
          sub
            .select('ur.value')
            .from(Rating, 'ur')
            .where('ur.store_id = store.id')
            .andWhere('ur.user_id = :userId'),
        'user_rating',
      ).setParameter('userId', ctx.userId);
    }

    return qb;
  }

  private mapRow(row: RawStoreRow, includeUserRating: boolean): StoreView {
    const view: StoreView = {
      id: row.id,
      name: row.name,
      email: row.email,
      address: row.address,
      overall_rating: row.overall_rating != null ? Number(row.overall_rating) : null,
    };
    if (includeUserRating) {
      view.user_rating = row.user_rating != null ? Number(row.user_rating) : null;
    }
    return view;
  }
}
