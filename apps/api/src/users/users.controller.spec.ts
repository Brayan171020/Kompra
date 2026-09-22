import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import request from 'supertest';

const getSessionMock = jest.fn<() => Promise<unknown>>().mockResolvedValue(null);
jest.unstable_mockModule('../auth/auth.js', () => ({ auth: { api: { getSession: getSessionMock } } }));
const { AuthGuard } = await import('../auth/guards/auth.guard.js');
const { UsersController } = await import('./users.controller.js');
const { UsersService } = await import('./users.service.js');

describe('UsersController smoke test', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: {} },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    await app.init();
  });

  afterAll(async () => app.close());

  it('returns 401 for GET /api/v1/users/me without a session', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    expect(getSessionMock).toHaveBeenCalled();
  });
});
