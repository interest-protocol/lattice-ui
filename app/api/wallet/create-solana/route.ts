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

  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  const mismatch = verifyUserMatch(auth.userId, body.userId);
  if (mismatch) return mismatch;

  try {
    const privy = getPrivyClient();

    const wallet = await privy.wallets().create({
      chain_type: 'solana',
      owner: { user_id: body.userId },
    });

    return NextResponse.json({
      id: wallet.id,
      address: wallet.address,
      chainType: wallet.chain_type,
    });
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to create wallet');
  }
}
