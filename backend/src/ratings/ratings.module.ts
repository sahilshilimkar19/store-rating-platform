import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/entities/store.entity';
import {
  RatingsController,
  StoreOwnerController,
} from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating } from './entities/rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Rating, Store])],
  controllers: [RatingsController, StoreOwnerController],
  providers: [RatingsService],
  exports: [RatingsService],
})
export class RatingsModule {}
