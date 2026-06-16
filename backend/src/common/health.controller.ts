import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from './decorators/public.decorator';

/**
 * Lightweight liveness probe for container orchestration / load balancers.
 * Public and unthrottled so health checks never trip the rate limiter.
 */
@ApiTags('Health')
@Public()
@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  check(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
