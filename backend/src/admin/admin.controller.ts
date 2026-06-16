import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AdminService } from './admin.service';

/** /admin — admin-only dashboard endpoints. */
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** KPI counts for the dashboard cards. */
  @Get('stats')
  stats() {
    return this.adminService.getStats();
  }

  /** Rich analytics: KPIs, rating distribution, top stores, recent activity. */
  @Get('analytics')
  analytics() {
    return this.adminService.getAnalytics();
  }
}
