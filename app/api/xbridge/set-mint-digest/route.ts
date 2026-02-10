import bs58 from 'bs58';
import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';

interface SetMintDigestBody {
  userId: string;
  requestId: string;
  mintCapId: string;
  depositSignature: string;
  rpcUrl?: string;
}

export async function POST(request: NextRequest) {
  const body: SetMintDigestBody = await request.json();

  if (!body.userId)
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  if (!body.requestId)
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  if (!body.mintCapId)
    return NextResponse.json({ error: 'Missing mintCapId' }, { status: 400 });
  if (!body.depositSignature)
    return NextResponse.json(
      { error: 'Missing depositSignature' },
      { status: 400 }
    );

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk(body.rpcUrl);

    const digest = bs58.decode(body.depositSignature);

    const tx = xbridge.setMintDigest({
      requestId: body.requestId,
      mintCapId: body.mintCapId,
      digest,
    });

    tx.setSender(wallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showEffects: true },
    });

    return NextResponse.json({ digest: txResult.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to set mint digest';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
