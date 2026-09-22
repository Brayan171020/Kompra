import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ListsService } from './lists.service.js';
import { ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { UserRole } from '../entities/user.entity.js';

const repo = (overrides: Record<string, unknown> = {}) => ({ create: (value: unknown) => value, save: async (value: unknown) => value, findOne: async () => null, findOneBy: async () => null, ...overrides });

describe('ListsService', () => {
  it('creates a list with the authenticated creator id', async () => {
    const save = jest.fn(async (value: unknown) => value);
    const service = new ListsService(repo({ save }) as never, repo() as never, repo() as never, repo() as never, repo() as never);
    const list = await service.create({ title: 'Weekly groceries' }, { id: 'creator-1', role: UserRole.CREATOR });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Weekly groceries', creatorId: 'creator-1', assignedToId: null, status: ShoppingListStatus.ACTIVE }));
    expect(list.creatorId).toBe('creator-1');
  });

  it('blocks a buyer from assigning a list', async () => {
    const service = new ListsService(repo({ findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: 'buyer-1', status: ShoppingListStatus.ACTIVE }) }) as never, repo() as never, repo() as never, repo() as never, repo() as never);
    await expect(service.assign('list-1', { assignedToId: 'buyer-2' }, { id: 'buyer-1', role: UserRole.BUYER })).rejects.toThrow(ForbiddenException);
  });

  it('assigns a list to a BUYER', async () => {
    const save = jest.fn(async (value: unknown) => value);
    const service = new ListsService(
      repo({ findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: null, status: ShoppingListStatus.ACTIVE }), save }) as never,
      repo() as never,
      repo({ findOne: async () => ({ id: 'buyer-2', role: UserRole.BUYER }) }) as never,
      repo({ findOneBy: async () => ({ userId: 'creator-1', contactId: 'buyer-2' }) }) as never,
      repo() as never,
    );
    const list = await service.assign('list-1', { assignedToId: 'buyer-2' }, { id: 'creator-1', role: UserRole.CREATOR });
    expect(list.assignedToId).toBe('buyer-2');
    expect(save).toHaveBeenCalled();
  });

  it('assigns a list to another CREATOR', async () => {
    const service = new ListsService(
      repo({ findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: null, status: ShoppingListStatus.ACTIVE }) }) as never,
      repo() as never,
      repo({ findOne: async () => ({ id: 'creator-2', role: UserRole.CREATOR }) }) as never,
      repo() as never,
      repo() as never,
    );
    const list = await service.assign('list-1', { assignedToId: 'creator-2' }, { id: 'creator-1', role: UserRole.CREATOR });
    expect(list.assignedToId).toBe('creator-2');
  });
});
