import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../common/enums/role.enum';
import { AuthenticatedUser } from '../interfaces/jwt-payload.interface';
import { RolesGuard } from './roles.guard';

/**
 * Builds a minimal ExecutionContext exposing the handler/class (for reflector
 * metadata lookup) and a request carrying the given user.
 */
function makeContext(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows the route when no @Roles metadata is present', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows the route when @Roles is an empty array', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(makeContext())).toBe(true);
  });

  it('allows a user whose role is in the required set', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const ctx = makeContext({
      userId: 'u1',
      email: 'a@example.com',
      role: Role.ADMIN,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects a user whose role is not in the required set', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const ctx = makeContext({
      userId: 'u1',
      email: 'n@example.com',
      role: Role.NORMAL,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when there is no authenticated user', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
