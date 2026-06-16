import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoreFilterDto } from './dto/store-filter.dto';
import { StoresService } from './stores.service';

/**
 * /stores — all routes require authentication. Creating a store additionally
 * requires the ADMIN role; the listings are open to every authenticated role.
 */
@ApiTags('Stores')
@ApiBearerAuth('access-token')
@Controller('stores')
@UseGuards(RolesGuard)
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /** Admin: create a store. */
  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.createStore(dto);
  }

  /** Any authenticated user: list stores. Normal users also get user_rating. */
  @Get()
  findAll(
    @Query() filter: StoreFilterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storesService.findAll(filter, {
      includeUserRating: user.role === Role.NORMAL,
      userId: user.userId,
    });
  }

  /** Any authenticated user: store detail. Normal users also get user_rating. */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.storesService.findOne(id, {
      includeUserRating: user.role === Role.NORMAL,
      userId: user.userId,
    });
  }
}

/**
 * /admin/stores — Admin-only listing. Same data as /stores but never includes
 * user_rating, with full filter + sort support.
 */
@ApiTags('Stores')
@ApiBearerAuth('access-token')
@Controller('admin/stores')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findAll(@Query() filter: StoreFilterDto) {
    return this.storesService.findAll(filter, {
      includeUserRating: false,
      includeOwner: true,
    });
  }
}
