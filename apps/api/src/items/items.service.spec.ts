import { describe, expect, it } from '@jest/globals';
import { ItemsService } from './items.service.js';
import { ListItemEntity, ListItemStatus } from '../entities/list-item.entity.js';
import { ShoppingListStatus } from '../entities/shopping-list.entity.js';

describe('ItemsService', () => {
  it('transitions an item to completed and sets the target quantity atomically', async () => {
    const item = { id: 'item-1', listId: 'list-1', targetQuantity: 3, purchasedQuantity: 0, status: ListItemStatus.PENDING, note: null };
    const saved: unknown[] = [];
    const manager = {
      getRepository: (entity: unknown) => entity === ListItemEntity
        ? { findOne: async () => item, save: async (value: unknown) => { saved.push(value); return value; } }
        : { findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: 'buyer-1', status: ShoppingListStatus.ACTIVE }) },
    };
    const dataSource = { transaction: async (work: (tx: typeof manager) => Promise<unknown>) => work(manager) };
    const service = new ItemsService({} as never, {} as never, {} as never, dataSource as never, {} as never);
    const result = await service.updateStatus('item-1', { status: ListItemStatus.COMPLETED }, { id: 'buyer-1', role: 'BUYER' });
    expect(result.status).toBe(ListItemStatus.COMPLETED);
    expect(result.purchasedQuantity).toBe(3);
    expect(saved).toHaveLength(1);
  });

  it('requires a note and a smaller quantity for partial completion', async () => {
    const item = { id: 'item-1', listId: 'list-1', targetQuantity: 3, purchasedQuantity: 0, status: ListItemStatus.PENDING, note: null };
    const manager = { getRepository: (entity: unknown) => ({ findOne: async () => entity === ListItemEntity ? item : { id: 'list-1', creatorId: 'creator-1', assignedToId: 'buyer-1', status: ShoppingListStatus.ACTIVE }, save: async (value: unknown) => value }) };
    const dataSource = { transaction: async (work: (tx: typeof manager) => Promise<unknown>) => work(manager) };
    const service = new ItemsService({} as never, {} as never, {} as never, dataSource as never, {} as never);
    await expect(service.updateStatus('item-1', { status: ListItemStatus.PARTIALLY_COMPLETED, purchasedQuantity: 1 }, { id: 'buyer-1', role: 'BUYER' })).rejects.toThrow();
  });
});
