import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { StoresService } from '../stores/stores.service';
import { RatingsService } from '../ratings/ratings.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStoreDto } from '../stores/dto/create-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly storesService: StoresService,
    private readonly ratingsService: RatingsService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    const totalUsers = await this.usersService.findAll();
    const totalStores = await this.storesService.findAll();
    const totalRatings = await this.ratingsService.getTotalRatingsCount();

    const userStats = await this.usersService.getStats();

    return {
      totalUsers: totalUsers.length,
      totalStores: totalStores.length,
      totalRatings,
      usersByRole: {
        admins: userStats.totalAdmins,
        users: totalUsers.filter((u) => u.role === UserRole.USER).length,
        storeOwners: userStats.totalStoreOwners,
      },
    };
  }

  @Post('users')
  async createUser(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { passwordHash, ...result } = user;
    return result;
  }

  @Post('stores')
  async createStore(@Body() createStoreDto: CreateStoreDto) {
    return await this.storesService.create(createStoreDto);
  }

  @Get('users')
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return users.map(({ passwordHash, ...user }) => user);
  }

  @Get('stores')
  async getAllStores() {
    return await this.storesService.findAll();
  }

  @Get('ratings')
  async getAllRatings() {
    return await this.ratingsService.findAll();
  }
}