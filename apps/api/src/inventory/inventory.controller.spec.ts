import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

describe('InventoryController contract', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const getSummary = jest.fn<() => Promise<unknown>>().mockResolvedValue({ month: '2026-09', totalItems: 0, totalQuantity: 0, totalCost: 0, byCategory: [] });
    const module = await Test.createTestingModule({ controllers: [InventoryController], providers: [{ provide: InventoryService, useValue: { getSummary } }] }).compile();
    app = module.createNestApplication(); app.setGlobalPrefix('api'); app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' }); await app.init();
  });
  afterAll(async () => app.close());
  it('exposes GET /api/v1/inventory/summary', async () => {
    await request(app.getHttpServer()).get('/api/v1/inventory/summary').expect(200).expect(({ body }) => expect(body).toEqual(expect.objectContaining({ totalItems: 0, byCategory: [] })));
  });
});
