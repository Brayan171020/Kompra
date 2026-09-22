import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';
import { ListItemStatus } from '../entities/list-item.entity.js';

describe('ItemsController contract', () => {
  let app: INestApplication;
  const updateStatus = jest.fn<() => Promise<unknown>>().mockResolvedValue({ id: 'item-1', status: ListItemStatus.COMPLETED, purchasedQuantity: 2 });

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [{ provide: ItemsService, useValue: { updateStatus } }],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => app.close());

  it('accepts the atomic status contract at PATCH /api/v1/items/:id/status', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/items/item-1/status')
      .send({ status: ListItemStatus.COMPLETED })
      .expect(200)
      .expect(({ body }) => expect(body).toEqual(expect.objectContaining({ id: 'item-1', status: ListItemStatus.COMPLETED })));
    expect(updateStatus).toHaveBeenCalledWith('item-1', { status: ListItemStatus.COMPLETED }, undefined);
  });
});
