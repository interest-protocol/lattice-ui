import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';

interface AuthResult {
  userId: string;
}

/**
 * Authenticate a request using the Privy access token from the Authorization header.
 * Returns the authenticated userId or a 401 NextResponse.
 *
 * Usage:
 *   const auth = await authenticateRequest(request);
 *   if (auth instanceof NextResponse) return auth;
 *   // auth.userId is now the verified user ID
 */
export const authenticateRequest = async (
  request: NextRequest
): Promise<AuthResult | NextResponse> => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing authorization token' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  try {
    const privy = getPrivyClient();
    const { user_id } = await privy.utils().auth().verifyAccessToken(token);
    return { userId: user_id };
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
};

/**
 * Verify that the authenticated user matches the userId in the request body.
 * Returns a 403 NextResponse if they don't match, or null if valid.
 */
export const verifyUserMatch = (
  authenticatedUserId: string,
  requestUserId: string
): NextResponse | null => {
  if (authenticatedUserId !== requestUserId) {
    return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
  }
  return null;
};
