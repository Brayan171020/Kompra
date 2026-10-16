import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const details = {
      method: request.method,
      path: request.path,
    };
    response.on('finish', () => {
      const payload = JSON.stringify({ ...details, statusCode: response.statusCode, durationMs: Date.now() - startedAt });
      if (response.statusCode >= 400) this.logger.warn(payload);
      else this.logger.log(payload);
    });
    next();
  }
}
