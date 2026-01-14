import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto, UpdateRatingDto } from './dto/create-rating.dto';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @Body('userId') userId: string,
  ) {
    return await this.ratingsService.create(userId, createRatingDto);
  }

  @Get()
  async findAll() {
    return await this.ratingsService.findAll();
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    return await this.ratingsService.findByUser(userId);
  }

  @Get('store/:storeId')
  async findByStore(@Param('storeId') storeId: string) {
    return await this.ratingsService.findByStore(storeId);
  }

  @Get('user/:userId/store/:storeId')
  async findUserRatingForStore(
    @Param('userId') userId: string,
    @Param('storeId') storeId: string,
  ) {
    return await this.ratingsService.findUserRatingForStore(userId, storeId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ratingsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRatingDto: UpdateRatingDto,
    @Body('userId') userId: string,
  ) {
    return await this.ratingsService.update(id, userId, updateRatingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Body('userId') userId: string) {
    await this.ratingsService.remove(id, userId);
  }
}