import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';

export interface AuthResult {
  userId: string;
  accessToken: string;
}

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
    return { userId: user_id, accessToken: token };
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
};

export const verifyUserMatch = (
  authenticatedUserId: string,
  requestUserId: string
): NextResponse | null => {
  if (authenticatedUserId !== requestUserId) {
    return NextResponse.json({ error: 'User ID mismatch' }, { status: 403 });
  }
  return null;
};
