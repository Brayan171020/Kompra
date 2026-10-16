import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, finalize, Observable, throwError } from 'rxjs';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = Date.now();
    const details = {
      method: request.method,
      path: request.path,
    };

    return next.handle().pipe(
      catchError((error: unknown) => {
        this.logger.error(JSON.stringify({
          ...details,
          statusCode: response.statusCode >= 400 ? response.statusCode : this.getErrorStatus(error),
          durationMs: Date.now() - startedAt,
          errorName: error instanceof Error ? error.name : 'UnknownError',
        }));
        return throwError(() => error);
      }),
      finalize(() => {
        const statusCode = response.statusCode;
        const payload = JSON.stringify({ ...details, statusCode, durationMs: Date.now() - startedAt });
        if (statusCode >= 400) this.logger.warn(payload);
        else this.logger.log(payload);
      }),
    );
  }

  private getErrorStatus(error: unknown): number {
    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') return error.status;
    const getStatus = typeof error === 'object' && error !== null && 'getStatus' in error
      ? (error as { getStatus?: unknown }).getStatus
      : undefined;
    if (typeof getStatus === 'function') return getStatus.call(error);
    return 500;
  }

}
