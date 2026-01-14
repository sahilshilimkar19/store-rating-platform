import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/create-store.dto';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(createStoreDto: CreateStoreDto): Promise<Store> {
    const existingStore = await this.storesRepository.findOne({
      where: { email: createStoreDto.email },
    });

    if (existingStore) {
      throw new ConflictException('Store email already exists');
    }

    const store = this.storesRepository.create(createStoreDto);
    return await this.storesRepository.save(store);
  }

  async findAll(filters?: {
    name?: string;
    address?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<Store[]> {
    const query = this.storesRepository
      .createQueryBuilder('store')
      .leftJoinAndSelect('store.owner', 'owner')
      .leftJoinAndSelect('store.ratings', 'rating');

    if (filters?.name) {
      query.andWhere('store.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (filters?.address) {
      query.andWhere('store.address LIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    query.orderBy(`store.${sortBy}`, sortOrder);

    const stores = await query.getMany();

    return stores.map((store) => ({
      ...store,
      averageRating: this.calculateAverageRating(store.ratings),
      totalRatings: store.ratings?.length || 0,
    }));
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id },
      relations: ['owner', 'ratings', 'ratings.user'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return {
      ...store,
      averageRating: this.calculateAverageRating(store.ratings),
      totalRatings: store.ratings?.length || 0,
    };
  }

  async findByOwnerId(ownerId: string): Promise<Store[]> {
    const stores = await this.storesRepository.find({
      where: { ownerId },
      relations: ['ratings', 'ratings.user'],
    });

    return stores.map((store) => ({
      ...store,
      averageRating: this.calculateAverageRating(store.ratings),
      totalRatings: store.ratings?.length || 0,
    }));
  }

  async update(id: string, updateStoreDto: UpdateStoreDto): Promise<Store> {
    const store = await this.findOne(id);

    if (updateStoreDto.email && updateStoreDto.email !== store.email) {
      const existingStore = await this.storesRepository.findOne({
        where: { email: updateStoreDto.email },
      });
      if (existingStore) {
        throw new ConflictException('Store email already exists');
      }
    }

    Object.assign(store, updateStoreDto);
    return await this.storesRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.storesRepository.remove(store);
  }

  async getStoreStats(storeId: string): Promise<{
    averageRating: number;
    totalRatings: number;
    ratingDistribution: Record<number, number>;
  }> {
    const store = await this.findOne(storeId);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    store.ratings?.forEach((rating) => {
      ratingDistribution[rating.rating]++;
    });

    return {
      averageRating: this.calculateAverageRating(store.ratings),
      totalRatings: store.ratings?.length || 0,
      ratingDistribution,
    };
  }

  private calculateAverageRating(ratings: any[]): number {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Math.round((sum / ratings.length) * 10) / 10;
  }
}