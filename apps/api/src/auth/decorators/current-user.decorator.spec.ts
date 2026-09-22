import { describe, expect, it } from '@jest/globals';
import { currentUserFactory } from './current-user.decorator.js';

describe('CurrentUser decorator', () => {
  it('maps the request user into a controller parameter', () => {
    const user = { id: 'user-1', role: 'BUYER' };
    expect(currentUserFactory(undefined, { switchToHttp: () => ({ getRequest: () => ({ user }) }) } as never)).toBe(user);
  });
});
