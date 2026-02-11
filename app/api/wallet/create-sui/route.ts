import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';

const schema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
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

  const mismatch = verifyUserMatch(auth.userId, body.userId);
  if (mismatch) return mismatch;

  try {
    const privy = getPrivyClient();

    const wallet = await privy.wallets().create({
      chain_type: 'sui',
      owner: { user_id: body.userId },
    });

    return NextResponse.json({
      id: wallet.id,
      address: wallet.address,
      chainType: wallet.chain_type,
    });
  } catch (error: unknown) {
    return errorResponse(error, 'Failed to create wallet');
  }
}
