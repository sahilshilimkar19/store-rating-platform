import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Rating } from '../ratings/entities/rating.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { User } from './entities/user.entity';

/** User fields safe to expose to clients (never includes the password hash). */
export type SafeUser = Pick<
  User,
  'id' | 'name' | 'email' | 'address' | 'role' | 'createdAt' | 'updatedAt'
>;

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  address: string | null;
  role: Role;
  /** Present only for store owners: average of all ratings for stores they own. */
  avgRating?: number | null;
}

export interface PaginatedUsers {
  data: Array<
    Pick<User, 'id' | 'name' | 'email' | 'address' | 'role' | 'createdAt'>
  >;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  /**
   * Look up a user by email. Pass withPassword=true to include the (normally
   * hidden) password hash — used by AuthService for login.
   */
  findByEmail(email: string, withPassword = false): Promise<User | null> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: email.toLowerCase().trim() });

    if (withPassword) {
      qb.addSelect('user.password');
    }
    return qb.getOne();
  }

  /** Look up a user by id (without password). Used e.g. to validate store owners. */
  findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /** Minimal list of store_owner users (for the store-owner picker). */
  findStoreOwners(): Promise<Array<Pick<User, 'id' | 'name' | 'email'>>> {
    return this.userRepository.find({
      where: { role: Role.STORE_OWNER },
      select: { id: true, name: true, email: true },
      order: { name: 'ASC' },
    });
  }

  /** Create a user with any role. Email must be unique. Returns a safe view. */
  async createUser(dto: CreateUserDto): Promise<SafeUser> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email,
      password: await this.hashPassword(dto.password),
      address: dto.address ?? null,
      role: dto.role,
    });

    const saved = await this.userRepository.save(user);
    return this.toSafeUser(saved);
  }

  /**
   * Paginated, filterable, sortable list of users across all roles (admin,
   * normal, and store owner). Narrow to a single role via the optional
   * `filter.role`.
   */
  async findAll(filter: UserFilterDto): Promise<PaginatedUsers> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.address',
        'user.role',
        'user.createdAt',
      ]);

    if (filter.name) {
      qb.andWhere('user.name ILIKE :name', { name: `%${filter.name}%` });
    }
    if (filter.email) {
      qb.andWhere('user.email ILIKE :email', { email: `%${filter.email}%` });
    }
    if (filter.address) {
      qb.andWhere('user.address ILIKE :address', {
        address: `%${filter.address}%`,
      });
    }
    if (filter.role) {
      qb.andWhere('user.role = :role', { role: filter.role });
    }

    // sortBy is whitelisted by the DTO (@IsIn), so this column map is injection-safe.
    const sortColumnMap: Record<string, string> = {
      name: 'user.name',
      email: 'user.email',
      address: 'user.address',
      role: 'user.role',
    };
    qb.orderBy(
      sortColumnMap[filter.sortBy],
      filter.sortOrder.toUpperCase() as 'ASC' | 'DESC',
    );

    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      data: rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        address: u.address,
        role: u.role,
        createdAt: u.createdAt,
      })),
      total,
      page: filter.page,
      limit: filter.limit,
      totalPages: Math.ceil(total / filter.limit),
    };
  }

  /**
   * Single user detail. For store owners, includes the average rating across
   * all stores they own (null if they have no rated stores).
   */
  async getUserDetail(id: string): Promise<UserDetail> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const detail: UserDetail = {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
    };

    if (user.role === Role.STORE_OWNER) {
      detail.avgRating = await this.getAverageRatingForOwner(id);
    }

    return detail;
  }

  /**
   * Self-service password change. Verifies the current password and ensures the
   * new password differs before applying it.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  /** Average of all ratings across the stores owned by this user. */
  private async getAverageRatingForOwner(
    ownerId: string,
  ): Promise<number | null> {
    const raw = await this.ratingRepository
      .createQueryBuilder('rating')
      .innerJoin('rating.store', 'store')
      .where('store.owner_id = :ownerId', { ownerId })
      .select('AVG(rating.value)', 'avg')
      .getRawOne<{ avg: string | null }>();

    if (!raw || raw.avg === null) {
      return null;
    }
    return Number(Number(raw.avg).toFixed(2));
  }

  private hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, UsersService.SALT_ROUNDS);
  }

  toSafeUser(user: User): SafeUser {
    const { id, name, email, address, role, createdAt, updatedAt } = user;
    return { id, name, email, address, role, createdAt, updatedAt };
  }
}
