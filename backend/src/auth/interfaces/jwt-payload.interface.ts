import { Role } from '../../common/enums/role.enum';

/**
 * Claims stored inside the signed JWT.
 * `sub` is the standard subject claim and holds the user id.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/**
 * Shape attached to `request.user` after JwtStrategy.validate runs.
 * This is what `@CurrentUser()` returns to controllers.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}
