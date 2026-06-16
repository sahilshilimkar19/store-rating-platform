import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or controller) as public, exempting it from the globally
 * registered JwtAuthGuard. Use on endpoints like login and register.
 *
 *   @Public()
 *   @Post('login')
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
