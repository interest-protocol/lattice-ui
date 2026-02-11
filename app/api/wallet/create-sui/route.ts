import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';

const schema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

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
