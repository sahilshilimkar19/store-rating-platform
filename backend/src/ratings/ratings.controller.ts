import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { RatingsService } from './ratings.service';

/** /ratings — Normal users submit and update their own ratings. */
@ApiTags('Ratings')
@ApiBearerAuth('access-token')
@Controller('ratings')
@UseGuards(RolesGuard)
@Roles(Role.NORMAL)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateRatingDto,
  ) {
    return this.ratingsService.create(userId, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRatingDto,
  ) {
    return this.ratingsService.update(userId, id, dto);
  }
}

/** /store-owner — dashboard for the store owner role. */
@ApiTags('Store Owner')
@ApiBearerAuth('access-token')
@Controller('store-owner')
@UseGuards(RolesGuard)
@Roles(Role.STORE_OWNER)
export class StoreOwnerController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser('userId') userId: string) {
    return this.ratingsService.getOwnerDashboard(userId);
  }
}
