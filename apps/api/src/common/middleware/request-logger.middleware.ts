import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggerMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    const details = {
      method: request.method,
      url: request.originalUrl || request.url,
      origin: request.get('origin') || null,
      forwardedFor: request.get('x-forwarded-for') || null,
    };
    response.on('finish', () => {
      const payload = JSON.stringify({ ...details, statusCode: response.statusCode, durationMs: Date.now() - startedAt });
      if (response.statusCode >= 400) this.logger.warn(payload);
      else this.logger.log(payload);
    });
    next();
  }
}
