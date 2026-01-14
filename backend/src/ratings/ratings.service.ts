import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rating } from './rating.entity';
import { CreateRatingDto, UpdateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private ratingsRepository: Repository<Rating>,
  ) {}

  async create(userId: string, createRatingDto: CreateRatingDto): Promise<Rating> {
    const existingRating = await this.ratingsRepository.findOne({
      where: {
        userId,
        storeId: createRatingDto.storeId,
      },
    });

    if (existingRating) {
      throw new ConflictException(
        'You have already rated this store. Use update to modify your rating.',
      );
    }

    const rating = this.ratingsRepository.create({
      userId,
      ...createRatingDto,
    });

    return await this.ratingsRepository.save(rating);
  }

  async findAll(): Promise<Rating[]> {
    return await this.ratingsRepository.find({
      relations: ['user', 'store'],
    });
  }

  async findByUser(userId: string): Promise<Rating[]> {
    return await this.ratingsRepository.find({
      where: { userId },
      relations: ['store'],
    });
  }

  async findByStore(storeId: string): Promise<Rating[]> {
    return await this.ratingsRepository.find({
      where: { storeId },
      relations: ['user'],
    });
  }

  async findUserRatingForStore(
    userId: string,
    storeId: string,
  ): Promise<Rating | null> {
    return await this.ratingsRepository.findOne({
      where: { userId, storeId },
      relations: ['user', 'store'],
    });
  }

  async findOne(id: string): Promise<Rating> {
    const rating = await this.ratingsRepository.findOne({
      where: { id },
      relations: ['user', 'store'],
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID ${id} not found`);
    }

    return rating;
  }

  async update(
    id: string,
    userId: string,
    updateRatingDto: UpdateRatingDto,
  ): Promise<Rating> {
    const rating = await this.findOne(id);

    if (rating.userId !== userId) {
      throw new BadRequestException('You can only update your own ratings');
    }

    rating.rating = updateRatingDto.rating;
    return await this.ratingsRepository.save(rating);
  }

  async remove(id: string, userId: string): Promise<void> {
    const rating = await this.findOne(id);

    if (rating.userId !== userId) {
      throw new BadRequestException('You can only delete your own ratings');
    }

    await this.ratingsRepository.remove(rating);
  }

  async getTotalRatingsCount(): Promise<number> {
    return await this.ratingsRepository.count();
  }
}