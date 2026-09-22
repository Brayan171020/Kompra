import { describe, expect, it, jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ListsService } from './lists.service.js';
import { ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { UserRole } from '../entities/user.entity.js';

const repo = (overrides: Record<string, unknown> = {}) => ({ create: (value: unknown) => value, save: async (value: unknown) => value, findOne: async () => null, ...overrides });

describe('ListsService', () => {
  it('creates a list with the authenticated creator id', async () => {
    const save = jest.fn(async (value: unknown) => value);
    const service = new ListsService(repo({ save }) as never, repo() as never, repo() as never, repo() as never);
    const list = await service.create({ title: 'Weekly groceries' }, { id: 'creator-1', role: UserRole.CREATOR });
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Weekly groceries', creatorId: 'creator-1', assignedToId: null, status: ShoppingListStatus.ACTIVE }));
    expect(list.creatorId).toBe('creator-1');
  });

  it('blocks a buyer from assigning a list', async () => {
    const service = new ListsService(repo({ findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: 'buyer-1', status: ShoppingListStatus.ACTIVE }) }) as never, repo() as never, repo() as never, repo() as never);
    await expect(service.assign('list-1', { assignedToId: 'buyer-2' }, { id: 'buyer-1', role: UserRole.BUYER })).rejects.toThrow(ForbiddenException);
  });
});
