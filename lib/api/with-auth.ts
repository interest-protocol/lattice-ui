import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

import {
  type AuthResult,
  authenticateRequest,
  verifyUserMatch,
} from '@/lib/api/auth';
import { validateBody } from '@/lib/api/validate-params';

/**
 * HOF wrapper for authenticated POST routes with Zod body validation.
 *
 * Handles: auth check → JSON parse → schema validation → optional userId verification.
 * The handler only receives validated data.
 */
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
      const mismatch = verifyUserMatch(
        auth.userId,
        (body as Record<string, unknown>).userId as string
      );
      if (mismatch) return mismatch;
    }

    return handler(body, auth, request);
  };
};

/**
 * HOF wrapper for authenticated GET routes (no body parsing).
 *
 * Handles: auth check only. The handler receives the authenticated user info.
 */
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
