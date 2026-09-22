import { describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';

const getSessionMock = jest.fn<() => Promise<unknown>>();
jest.unstable_mockModule('../auth.js', () => ({ auth: { api: { getSession: getSessionMock } } }));
const { AuthGuard } = await import('./auth.guard.js');
const { auth } = await import('../auth.js');

function context(request: Record<string, unknown>) {
  return { switchToHttp: () => ({ getRequest: () => request }), getHandler: () => ({}), getClass: () => ({}) } as never;
}

describe('AuthGuard', () => {
  it('rejects requests without a valid Better Auth session', async () => {
    getSessionMock.mockResolvedValue(null);
    const reflector = { getAllAndOverride: () => false };
    await expect(new AuthGuard(reflector as never).canActivate(context({ headers: {} }))).rejects.toThrow(UnauthorizedException);
    expect(getSessionMock).toHaveBeenCalled();
  });

  it('attaches the Better Auth user and session to the request', async () => {
    const session = { user: { id: 'user-1', name: 'Brayan', email: 'brayan@example.com' }, session: { id: 'session-1' } };
    getSessionMock.mockResolvedValue(session);
    const request: Record<string, unknown> = { headers: {} };
    const reflector = { getAllAndOverride: () => false };
    await expect(new AuthGuard(reflector as never).canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual(session.user);
    expect(request.session).toEqual(session.session);
  });
});
