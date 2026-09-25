import { CanActivate, ExecutionContext, Injectable, Optional, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { auth } from '../auth.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

type AuthenticatedRequest = Request & { user?: unknown; session?: unknown };
type NeonSessionRow = {
  sessionId: string;
  sessionUserId: string;
  sessionToken: string;
  sessionExpiresAt: Date;
  sessionIpAddress: string | null;
  sessionUserAgent: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  userEmailVerified: boolean;
  userImage: string | null;
  userRole: string | null;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Optional() private readonly dataSource?: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (session) {
      request.user = session.user;
      request.session = session.session;
      return true;
    }

    const neonSession = await this.findNeonSession(request);
    if (!neonSession) throw new UnauthorizedException('A valid session is required');

    request.user = {
      id: neonSession.userId,
      name: neonSession.userName,
      email: neonSession.userEmail,
      emailVerified: neonSession.userEmailVerified,
      image: neonSession.userImage,
      role: neonSession.userRole,
    };
    request.session = {
      id: neonSession.sessionId,
      userId: neonSession.sessionUserId,
      token: neonSession.sessionToken,
      expiresAt: neonSession.sessionExpiresAt,
      ipAddress: neonSession.sessionIpAddress,
      userAgent: neonSession.sessionUserAgent,
    };
    return true;
  }

  private async findNeonSession(request: Request): Promise<NeonSessionRow | null> {
    if (!this.dataSource) return null;
    const authorization = request.headers.authorization;
    if (!authorization) return null;
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) return null;

    const token = match[1].trim();
    if (!token) return null;
    const candidates = [...new Set([token, token.split('.')[0]])];
    const placeholders = candidates.map((_, index) => `$${index + 1}`).join(', ');
    const rows = await this.dataSource.query<NeonSessionRow[]>(
      `
        SELECT
          s.id AS "sessionId",
          s."userId" AS "sessionUserId",
          s.token AS "sessionToken",
          s."expiresAt" AS "sessionExpiresAt",
          s."ipAddress" AS "sessionIpAddress",
          s."userAgent" AS "sessionUserAgent",
          u.id AS "userId",
          u.name AS "userName",
          u.email AS "userEmail",
          u."emailVerified" AS "userEmailVerified",
          u.image AS "userImage",
          u.role AS "userRole"
        FROM neon_auth."session" s
        INNER JOIN neon_auth."user" u ON u.id = s."userId"
        WHERE s.token IN (${placeholders})
          AND s."expiresAt" > NOW()
        LIMIT 1
      `,
      candidates,
    );
    return rows[0] ?? null;
  }
}
