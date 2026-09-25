import { getNeonAuth } from '../../../../lib/auth-server';

export const dynamic = 'force-dynamic';

type AuthHandlerContext = { params: Promise<{ path: string[] }> };

async function handleAuthRequest(request: Request, context: AuthHandlerContext): Promise<Response> {
  return getNeonAuth().handler().GET(request, context);
}

export const GET = handleAuthRequest;
export const POST = handleAuthRequest;
export const PUT = handleAuthRequest;
export const PATCH = handleAuthRequest;
export const DELETE = handleAuthRequest;
