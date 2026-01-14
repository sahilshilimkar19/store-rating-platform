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
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/create-store.dto';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  async create(@Body() createStoreDto: CreateStoreDto) {
    return await this.storesService.create(createStoreDto);
  }

  @Get()
  async findAll(
    @Query('name') name?: string,
    @Query('address') address?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return await this.storesService.findAll({
      name,
      address,
      sortBy,
      sortOrder,
    });
  }

  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId') ownerId: string) {
    return await this.storesService.findByOwnerId(ownerId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.storesService.findOne(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return await this.storesService.getStoreStats(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStoreDto: UpdateStoreDto,
  ) {
    return await this.storesService.update(id, updateStoreDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.storesService.remove(id);
  }
}