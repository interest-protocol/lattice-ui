import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { validateBody } from '@/lib/api/validate-params';
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
      chain_type: 'solana',
      owner: { user_id: body.userId },
    });

    return NextResponse.json({
      id: wallet.id,
      address: wallet.address,
      chainType: wallet.chain_type,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to create wallet';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
