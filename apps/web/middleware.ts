import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
  // Leave OAuth token parameters available to AppLayout's session bootstrap.
  // It validates the token and removes it from the URL after initialization.
  return NextResponse.next();
}

export const config = { matcher: ['/app/:path*'] };
