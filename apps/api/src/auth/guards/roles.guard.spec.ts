import { describe, expect, it } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard.js';
import { UserRole } from '../../entities/user.entity.js';

function context(user: unknown) {
  return { switchToHttp: () => ({ getRequest: () => ({ user }) }), getHandler: () => ({}), getClass: () => ({}) } as never;
}

describe('RolesGuard', () => {
  it('allows requests when no roles metadata is defined', () => {
    const reflector = { getAllAndOverride: () => undefined };
    expect(new RolesGuard(reflector as never).canActivate(context(undefined))).toBe(true);
  });

  it('allows a user with one of the declared roles', () => {
    const reflector = { getAllAndOverride: () => [UserRole.CREATOR] };
    expect(new RolesGuard(reflector as never).canActivate(context({ role: UserRole.CREATOR }))).toBe(true);
  });

  it('blocks a user with an undeclared role', () => {
    const reflector = { getAllAndOverride: () => [UserRole.CREATOR] };
    expect(() => new RolesGuard(reflector as never).canActivate(context({ role: UserRole.BUYER }))).toThrow(ForbiddenException);
  });
});
