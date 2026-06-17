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

/** Context describing what extra columns to attach to store rows. */
interface RatingContext {
  includeUserRating: boolean;
  userId?: string;
  /** Include the owning user (id + name) — used by the admin store listing. */
  includeOwner?: boolean;
}

export interface StoreView {
  id: string;
  name: string;
  email: string;
  address: string | null;
  created_at: string;
  overall_rating: number | null;
  /** Present only when the caller is a Normal User. */
  user_rating?: number | null;
  /** Id of the caller's own rating row (for updates); null if not yet rated. */
  user_rating_id?: string | null;
  /** Owning store_owner (admin listing only); null if the store has no owner. */
  owner_id?: string | null;
  owner_name?: string | null;
}

/** Paginated store listing envelope (mirrors the users list shape). */
export interface PaginatedStores {
  data: StoreView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface RawStoreRow {
  id: string;
  name: string;
  email: string;
  address: string | null;
  created_at: string | Date;
  overall_rating: string | null;
  user_rating?: string | null;
  user_rating_id?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
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

  /** List stores with overall_rating (and user_rating for normal users), paginated. */
  async findAll(
    filter: StoreFilterDto,
    ctx: RatingContext,
  ): Promise<PaginatedStores> {
    const qb = this.buildStoreQuery(ctx);
    this.applyFilters(qb, filter);

    // sortBy is whitelisted by the DTO (@IsIn), so this map is injection-safe.
    // 'rating'/'overall_rating' order by the computed average alias; 'user_rating'
    // only exists for a Normal User listing, otherwise fall back to name.
    const sortExprMap: Record<string, string> = {
      name: 'store.name',
      email: 'store.email',
      address: 'store.address',
      rating: 'overall_rating',
      overall_rating: 'overall_rating',
      user_rating: 'user_rating',
    };
    let sortExpr = sortExprMap[filter.sortBy] ?? 'store.name';
    if (sortExpr === 'user_rating' && !ctx.includeUserRating) {
      sortExpr = 'store.name';
    }
    qb.orderBy(sortExpr, filter.sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const page = filter.page;
    const limit = filter.limit;
    qb.limit(limit).offset((page - 1) * limit);

    const rows = await qb.getRawMany<RawStoreRow>();

    // Count matching stores (filters only — independent of the rating subqueries).
    const countQb = this.storeRepository.createQueryBuilder('store');
    this.applyFilters(countQb, filter);
    const total = await countQb.getCount();

    return {
      data: rows.map((row) => this.mapRow(row, ctx)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /** Apply the shared partial-match filters to a store query builder. */
  private applyFilters(
    qb: SelectQueryBuilder<Store>,
    filter: StoreFilterDto,
  ): void {
    if (filter.search) {
      qb.andWhere('(store.name ILIKE :search OR store.address ILIKE :search)', {
        search: `%${filter.search}%`,
      });
    }
    if (filter.name) {
      qb.andWhere('store.name ILIKE :name', { name: `%${filter.name}%` });
    }
    if (filter.email) {
      qb.andWhere('store.email ILIKE :email', { email: `%${filter.email}%` });
    }
    if (filter.address) {
      qb.andWhere('store.address ILIKE :address', {
        address: `%${filter.address}%`,
      });
    }
  }

  /** Single store detail with overall_rating (and user_rating for normal users). */
  async findOne(id: string, ctx: RatingContext): Promise<StoreView> {
    const row = await this.buildStoreQuery(ctx)
      .where('store.id = :id', { id })
      .getRawOne<RawStoreRow>();

    if (!row) {
      throw new NotFoundException('Store not found');
    }
    return this.mapRow(row, ctx);
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
      .addSelect('store.createdAt', 'created_at')
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
      )
        .addSelect(
          (sub) =>
            sub
              .select('uri.id')
              .from(Rating, 'uri')
              .where('uri.store_id = store.id')
              .andWhere('uri.user_id = :userId'),
          'user_rating_id',
        )
        .setParameter('userId', ctx.userId);
    }

    if (ctx.includeOwner) {
      qb.leftJoin('store.owner', 'owner')
        .addSelect('owner.id', 'owner_id')
        .addSelect('owner.name', 'owner_name');
    }

    return qb;
  }

  private mapRow(row: RawStoreRow, ctx: RatingContext): StoreView {
    const view: StoreView = {
      id: row.id,
      name: row.name,
      email: row.email,
      address: row.address,
      created_at: new Date(row.created_at).toISOString(),
      overall_rating:
        row.overall_rating != null ? Number(row.overall_rating) : null,
    };
    if (ctx.includeUserRating) {
      view.user_rating =
        row.user_rating != null ? Number(row.user_rating) : null;
      view.user_rating_id = row.user_rating_id ?? null;
    }
    if (ctx.includeOwner) {
      view.owner_id = row.owner_id ?? null;
      view.owner_name = row.owner_name ?? null;
    }
    return view;
  }
}
