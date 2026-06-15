import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Injects the authenticated user (as resolved by JwtStrategy.validate) into a
 * controller handler. Pass a property name to extract a single field.
 *
 *   changePassword(@CurrentUser() user: AuthenticatedUser) { ... }
 *   changePassword(@CurrentUser('userId') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;
    return data ? user?.[data] : user;
  },
);
