import { describe, expect, it, jest } from '@jest/globals';
import { InventoryService } from './inventory.service.js';
import { ListItemStatus } from '../entities/list-item.entity.js';
import { ShoppingListStatus } from '../entities/shopping-list.entity.js';
import { InventoryUnit } from './dto/create-inventory-purchase.dto.js';

const actor = { id: 'creator-1', role: 'CREATOR' };

describe('InventoryService', () => {
  it('creates a validated manual purchase for the current user', async () => {
    const saved = jest.fn(async (value: unknown) => value);
    const service = new InventoryService({ create: (value: unknown) => value, save: saved } as never, { existsBy: async () => true } as never, {} as never, {} as never, {} as never);
    const purchase = await service.create({ productName: 'Leche', categoryId: 'category-1', quantity: 2, unit: InventoryUnit.UNIT, purchaseDate: '2026-09-20T12:00:00.000Z' }, actor);
    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ productName: 'Leche', creatorId: 'creator-1', cost: null, sourceItemId: null }));
    expect(purchase.productName).toBe('Leche');
  });

  it('calculates current-month category percentages and costs', async () => {
    const purchases = [
      { categoryId: 'cat-a', quantity: 2, cost: 5 },
      { categoryId: 'cat-a', quantity: 1, cost: null },
      { categoryId: 'cat-b', quantity: 3, cost: 4 },
    ];
    const service = new InventoryService({ find: async () => purchases } as never, { findBy: async () => [{ id: 'cat-a', name: 'Frutas', color: '#00aa00' }, { id: 'cat-b', name: 'Víveres', color: '#ffaa00' }] } as never, {} as never, {} as never, {} as never);
    const summary = await service.getSummary(actor);
    expect(summary.totalItems).toBe(3);
    expect(summary.totalQuantity).toBe(6);
    expect(summary.totalCost).toBe(9);
    expect(summary.byCategory[0]).toEqual(expect.objectContaining({ categoryId: 'cat-a', count: 2, percentage: 67 }));
  });

  it('imports completed and partial items while ignoring pending and duplicates', async () => {
    const items = [
      { id: 'item-completed', listId: 'list-1', name: 'Arroz', categoryId: 'cat-1', purchasedQuantity: 2, quantityType: 'UNIT', status: ListItemStatus.COMPLETED, note: null },
      { id: 'item-partial', listId: 'list-1', name: 'Tomates', categoryId: 'cat-2', purchasedQuantity: 0.5, quantityType: 'WEIGHT', status: ListItemStatus.PARTIALLY_COMPLETED, note: 'Solo había pequeños' },
      { id: 'item-pending', listId: 'list-1', name: 'Pan', categoryId: 'cat-1', purchasedQuantity: 0, quantityType: 'UNIT', status: ListItemStatus.PENDING, note: null },
    ];
    const saved: unknown[] = []; let purchaseLookup = 0; const purchaseRepository = { create: (value: unknown) => value, findOne: async () => { purchaseLookup += 1; return purchaseLookup === 2 ? { id: 'existing' } : null; }, save: async (value: unknown) => { saved.push(value); return value; } }; let repositoryCall = 0;
    const manager = { getRepository: () => { repositoryCall += 1; return repositoryCall === 1 ? { findOne: async () => ({ id: 'list-1', creatorId: 'creator-1', assignedToId: null, status: ShoppingListStatus.FINISHED, finishedAt: new Date(), createdAt: new Date() }) } : repositoryCall === 2 ? { find: async () => items.filter((item) => item.status !== ListItemStatus.PENDING) } : purchaseRepository; } };
    const service = new InventoryService({} as never, {} as never, {} as never, {} as never, { transaction: async (work: (tx: typeof manager) => Promise<unknown>) => work(manager) } as never);
    const result = await service.importFromList('list-1', actor);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(saved[0]).toEqual(expect.objectContaining({ sourceItemId: 'item-completed', unit: 'und', quantity: 2 }));
  });
});
