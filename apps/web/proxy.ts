import type { NextRequest } from 'next/server';
import { getNeonAuth } from './lib/auth-server';

export default function proxy(request: NextRequest) {
  return getNeonAuth().middleware({ loginUrl: '/login' })(request);
}

export const config = {
  matcher: ['/app/:path*'],
};
