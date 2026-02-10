import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';

export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  if (!userId || typeof userId !== 'string')
    return NextResponse.json(
      { error: 'Missing userId (did:privy:...)' },
      { status: 400 }
    );

  try {
    const privy = getPrivyClient();

    const wallet = await privy.wallets().create({
      chain_type: 'sui',
      owner: { user_id: userId },
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
