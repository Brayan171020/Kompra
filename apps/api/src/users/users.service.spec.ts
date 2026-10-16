import { describe, expect, it, jest } from '@jest/globals';
import { UsersService } from './users.service.js';
import { UserRole } from '../entities/user.entity.js';

describe('UsersService contact codes', () => {
  it('omits contact share codes from network responses', async () => {
    const service = new UsersService(
      { findByIds: async () => [{ id: 'contact-1', name: 'Contacto', email: 'contact@example.com', role: UserRole.BUYER, shareCode: 'KMP-SECRET' }] } as never,
      { find: async () => [{ userId: 'user-1', contactId: 'contact-1' }] } as never,
      {} as never,
      {} as never,
    );
    expect(await service.getContacts('user-1')).toEqual([{ id: 'contact-1', name: 'Contacto', email: 'contact@example.com', role: UserRole.BUYER }]);
  });

  it('generates a random-format code and keeps it on later profile syncs', async () => {
    let shareCode: string | null = null;
    const upsert = jest.fn(async (profile: { shareCode: string }) => { shareCode = profile.shareCode; });
    const users = {
      findOneBy: async () => shareCode ? { role: UserRole.CREATOR, shareCode } : null,
      findOneByOrFail: async () => ({ id: 'public-user-id', role: UserRole.CREATOR, shareCode }),
      upsert,
    };
    const service = new UsersService(users as never, {} as never, {} as never,
      { query: async () => [{ hasRoleColumn: false }] } as never);
    const identity = { id: 'public-user-id', name: 'Test', email: 'test@example.com', emailVerified: false };
    await service.syncFromAuth(identity);
    const firstCode = shareCode;
    expect(firstCode).toMatch(/^KMP-[A-F0-9]{24}$/);
    await service.syncFromAuth(identity);
    expect(shareCode).toBe(firstCode);
  });
});
