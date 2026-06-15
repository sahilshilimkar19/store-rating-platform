import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { UsersService } from './users.service';

/**
 * All routes require a valid JWT. By default they also require the ADMIN role
 * (class-level @Roles); individual routes override this where noted.
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Admin: create a user of any role. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser(dto);
  }

  /** Admin: paginated/filterable/sortable list of admin + normal users. */
  @Get()
  findAll(@Query() filter: UserFilterDto) {
    return this.usersService.findAll(filter);
  }

  /**
   * Admin: minimal list of store_owner users, for selecting a store's owner.
   * Declared before :id so it isn't captured by the dynamic param route.
   */
  @Get('store-owners')
  findStoreOwners() {
    return this.usersService.findStoreOwners();
  }

  /** Admin: single user detail (includes avgRating for store owners). */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserDetail(id);
  }

  /**
   * Self-service password change for Normal Users and Store Owners only.
   * A user may only change their OWN password — there is no admin override here.
   */
  @Patch(':id/change-password')
  @Roles(Role.NORMAL, Role.STORE_OWNER)
  @HttpCode(HttpStatus.OK)
  changeOwnPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    if (id !== user.userId) {
      throw new ForbiddenException('You can only change your own password');
    }
    return this.usersService.changePassword(
      id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
