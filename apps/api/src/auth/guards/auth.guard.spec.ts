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
  const dataSource = { getRepository: () => ({ findOne: async () => ({ role: 'BUYER' }) }), query: async () => [] };

  it('rejects requests without a valid Better Auth session', async () => {
    getSessionMock.mockResolvedValue(null);
    const reflector = { getAllAndOverride: () => false };
    await expect(new AuthGuard(reflector as never, dataSource as never).canActivate(context({ headers: {} }))).rejects.toThrow(UnauthorizedException);
    expect(getSessionMock).toHaveBeenCalled();
  });

  it('uses the current profile role instead of a stale session role', async () => {
    const session = { user: { id: 'user-1', name: 'Brayan', email: 'brayan@example.com', role: 'CREATOR' }, session: { id: 'session-1' } };
    getSessionMock.mockResolvedValue(session);
    const request: Record<string, unknown> = { headers: {} };
    const reflector = { getAllAndOverride: () => false };
    await expect(new AuthGuard(reflector as never, dataSource as never).canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual({ ...session.user, role: 'BUYER' });
    expect(request.session).toEqual(session.session);
  });

  it('validates a bearer session without copying its token into the request session', async () => {
    getSessionMock.mockResolvedValue(null);
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer private-token' } };
    const query = jest.fn(async () => [{
      sessionId: 'session-1', sessionUserId: 'user-1', sessionExpiresAt: new Date(),
      sessionIpAddress: null, sessionUserAgent: null, userId: 'user-1',
      userName: 'Brayan', userEmail: 'brayan@example.com', userEmailVerified: true, userImage: null,
    }]);
    const dataSource = { getRepository: () => ({ findOne: async () => ({ role: 'BUYER' }) }), query };
    const reflector = { getAllAndOverride: () => false };
    await expect(new AuthGuard(reflector as never, dataSource as never).canActivate(context(request))).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(expect.any(String), ['private-token']);
    expect(request.user).toEqual(expect.objectContaining({ id: 'user-1', role: 'BUYER' }));
    expect(request.session).not.toEqual(expect.objectContaining({ token: expect.anything() }));
  });
});
