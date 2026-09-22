import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const currentUserFactory = (_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
  return request.user;
};

export const CurrentUser = createParamDecorator(currentUserFactory);
