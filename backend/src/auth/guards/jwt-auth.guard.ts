import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard backed by the 'jwt' Passport strategy. Validates the Bearer token and
 * populates `request.user` with the AuthenticatedUser. Use on any route that
 * requires authentication.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
