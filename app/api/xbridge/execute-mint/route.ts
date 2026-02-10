import { WRAPPED_SOL_OTW } from '@interest-protocol/xbridge-sdk';
import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';

interface ExecuteMintBody {
  userId: string;
  requestId: string;
  mintCapId: string;
  coinType?: string;
  rpcUrl?: string;
}

export async function POST(request: NextRequest) {
  const body: ExecuteMintBody = await request.json();

  if (!body.userId)
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  if (!body.requestId)
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  if (!body.mintCapId)
    return NextResponse.json({ error: 'Missing mintCapId' }, { status: 400 });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk(body.rpcUrl);

    const { tx, result: mintedCoin } = xbridge.executeMintRequest({
      requestId: body.requestId,
      mintCapId: body.mintCapId,
      coinType: body.coinType || WRAPPED_SOL_OTW,
    });

    tx.setSender(wallet.address);
    tx.transferObjects(
      [mintedCoin as Parameters<typeof tx.transferObjects>[0][0]],
      wallet.address
    );

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showEffects: true, showObjectChanges: true },
    });

    return NextResponse.json({ digest: txResult.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to execute mint';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
