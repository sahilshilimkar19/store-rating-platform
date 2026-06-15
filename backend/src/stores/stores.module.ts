import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Rating } from '../ratings/entities/rating.entity';
import { Store } from './entities/store.entity';
import {
  AdminStoresController,
  StoresController,
} from './stores.controller';
import { StoresService } from './stores.service';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Rating]), UsersModule],
  controllers: [StoresController, AdminStoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
