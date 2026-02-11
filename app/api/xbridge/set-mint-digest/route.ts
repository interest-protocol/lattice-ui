import bs58 from 'bs58';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  mintCapId: z.string(),
  depositSignature: z.string(),
  rpcUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

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
      return errorResponse(error, error.message, 404);
    return errorResponse(error, 'Failed to set mint digest');
  }
}
