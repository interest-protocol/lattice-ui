import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

import {
  type AuthResult,
  authenticateRequest,
  verifyUserMatch,
} from '@/lib/api/auth';
import { validateBody } from '@/lib/api/validate-params';

export const withAuthPost = <T>(
  schema: ZodSchema<T>,
  handler: (
    body: T,
    auth: AuthResult,
    request: NextRequest
  ) => Promise<NextResponse>,
  options: { verifyUserId?: boolean } = {}
): ((request: NextRequest) => Promise<NextResponse>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { data: body, error } = validateBody(rawBody, schema);
    if (error) return error;

    if (options.verifyUserId) {
      const bodyRecord = body as Record<string, unknown>;
      const bodyUserId =
        typeof bodyRecord.userId === 'string' ? bodyRecord.userId : '';
      const mismatch = verifyUserMatch(auth.userId, bodyUserId);
      if (mismatch) return mismatch;
    }

    return handler(body, auth, request);
  };
};

export const withAuthGet = (
  handler: (
    auth: AuthResult,
    request: NextRequest
  ) => Promise<NextResponse>
): ((request: NextRequest) => Promise<NextResponse>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    return handler(auth, request);
  };
};
