import { describe, expect, it, jest } from '@jest/globals';
import { CategoriesService } from './categories.service.js';

describe('CategoriesService', () => {
  it('lists only global categories and categories owned by the caller', async () => {
    const find = jest.fn(async () => []);
    const service = new CategoriesService({ find } as never);
    await service.findAll('user-1');
    expect(find).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.arrayContaining([expect.objectContaining({ creatorId: 'user-1' })]),
    }));
  });
});
