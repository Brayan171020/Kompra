import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { INestApplication, UnauthorizedException, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../src/health/health.controller.js';
import { HealthService } from '../src/health/health.service.js';
import { CategoriesController } from '../src/categories/categories.controller.js';
import { ListsController } from '../src/lists/lists.controller.js';
import { ListsService } from '../src/lists/lists.service.js';
import { ItemsController } from '../src/items/items.controller.js';
import { ItemsService } from '../src/items/items.service.js';
import { InventoryController } from '../src/inventory/inventory.controller.js';
import { InventoryService } from '../src/inventory/inventory.service.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { CategoriesService } from '../src/categories/categories.service.js';
import { UserRole } from '../src/entities/user.entity.js';
import { ListItemStatus, QuantityType } from '../src/entities/list-item.entity.js';
import { ShoppingListStatus } from '../src/entities/shopping-list.entity.js';

const categoryId = '11111111-1111-4111-8111-111111111111';
const listId = '22222222-2222-4222-8222-222222222222';
const itemId = '33333333-3333-4333-8333-333333333333';
const actor = { id: '44444444-4444-4444-8444-444444444444', role: UserRole.CREATOR };

describe('Kompra API E2E contract (isolated in-memory services)', () => {
  let app: INestApplication;
  const lists = new Map<string, Record<string, unknown>>();
  const items = new Map<string, Record<string, unknown>>();
  let imported = 0;

  const listService = {
    create: async (dto: { title: string }) => { const list = { id: listId, title: dto.title, status: ShoppingListStatus.ACTIVE, creatorId: actor.id, assignedToId: null }; lists.set(listId, list); return list; },
    findMine: async () => [...lists.values()],
    findOne: async (id: string) => lists.get(id),
    assign: async (id: string) => lists.get(id),
    finish: async (id: string) => { const list = lists.get(id); if (list) list.status = ShoppingListStatus.FINISHED; return list; },
  };
  const itemService = {
    create: async (_listId: string, dto: Record<string, unknown>) => { const item = { id: itemId, listId, ...dto, status: ListItemStatus.PENDING, purchasedQuantity: 0 }; items.set(itemId, item); return item; },
    updateStatus: async (id: string, dto: Record<string, unknown>) => { const item = items.get(id); if (!item) return undefined; Object.assign(item, dto); return item; },
    remove: async (id: string) => { items.delete(id); },
  };
  const inventoryService = {
    importFromList: async (sourceListId: string) => { if (lists.get(sourceListId)?.status === ShoppingListStatus.FINISHED && imported === 0) imported = 1; return { imported, skipped: imported ? 1 : 0, purchases: [] }; },
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [HealthController, CategoriesController, ListsController, ItemsController, InventoryController],
      providers: [
        { provide: HealthService, useValue: { check: async () => ({ status: 'ok', database: 'in-memory', timestamp: new Date().toISOString() }) } },
        { provide: CategoriesService, useValue: { findAll: async () => [{ id: categoryId, name: 'Víveres', color: '#E9C46A', icon: 'wheat' }] } },
        { provide: ListsService, useValue: listService },
        { provide: ItemsService, useValue: itemService },
        { provide: InventoryService, useValue: inventoryService },
        { provide: APP_GUARD, useFactory: () => ({ canActivate: (context: { switchToHttp: () => { getRequest: () => { headers: Record<string, string>; path?: string; user?: unknown } } }) => { const request = context.switchToHttp().getRequest(); if (request.path === '/api/v1/health' || request.path === '/api/v1/categories') return true; if (request.headers['x-test-auth'] !== 'creator') throw new UnauthorizedException(); request.user = actor; return true; } }) },
        { provide: APP_GUARD, useClass: RolesGuard },
        Reflector,
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('serves health and public categories without authentication', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect(({ body }) => expect(body.database).toBe('in-memory'));
    await request(app.getHttpServer()).get('/api/v1/categories').expect(200).expect(({ body }) => expect(body[0].id).toBe(categoryId));
  });

  it('rejects unauthenticated list creation and creates a valid list when authenticated', async () => {
    await request(app.getHttpServer()).post('/api/v1/lists').send({ title: 'Compra semanal' }).expect(401);
    await request(app.getHttpServer()).post('/api/v1/lists').set('x-test-auth', 'creator').send({ title: 'Compra semanal' }).expect(201).expect(({ body }) => expect(body.status).toBe(ShoppingListStatus.ACTIVE));
  });

  it('validates item payloads and supports UNIT and WEIGHT item types', async () => {
    await request(app.getHttpServer()).post(`/api/v1/lists/${listId}/items`).set('x-test-auth', 'creator').send({ name: 'Pan', categoryId: 'not-a-uuid', quantityType: 'UNIT', targetQuantity: 1 }).expect(400);
    await request(app.getHttpServer()).post(`/api/v1/lists/${listId}/items`).set('x-test-auth', 'creator').send({ name: 'Pan', categoryId, quantityType: QuantityType.UNIT, targetQuantity: 2 }).expect(201);
    await request(app.getHttpServer()).post(`/api/v1/lists/${listId}/items`).set('x-test-auth', 'creator').send({ name: 'Tomates', categoryId, quantityType: QuantityType.WEIGHT, targetQuantity: 1.5 }).expect(201);
  });

  it('transitions items to COMPLETED and PARTIALLY_COMPLETED with quantity and note', async () => {
    await request(app.getHttpServer()).patch(`/api/v1/items/${itemId}/status`).set('x-test-auth', 'creator').send({ status: ListItemStatus.COMPLETED }).expect(200).expect(({ body }) => expect(body.status).toBe(ListItemStatus.COMPLETED));
    await request(app.getHttpServer()).patch(`/api/v1/items/${itemId}/status`).set('x-test-auth', 'creator').send({ status: ListItemStatus.PARTIALLY_COMPLETED, purchasedQuantity: 1, note: 'Solo había una unidad' }).expect(200).expect(({ body }) => expect(body.note).toBe('Solo había una unidad'));
  });

  it('imports only once from a FINISHED list', async () => {
    await request(app.getHttpServer()).patch(`/api/v1/lists/${listId}/finish`).set('x-test-auth', 'creator').expect(200);
    await request(app.getHttpServer()).post(`/api/v1/inventory/import-from-list/${listId}`).set('x-test-auth', 'creator').expect(201).expect(({ body }) => expect(body.imported).toBe(1));
    await request(app.getHttpServer()).post(`/api/v1/inventory/import-from-list/${listId}`).set('x-test-auth', 'creator').expect(201).expect(({ body }) => expect(body.skipped).toBe(1));
  });
});
