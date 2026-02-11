import { WRAPPED_SOL_OTW } from '@interest-protocol/xbridge-sdk';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  mintCapId: z.string(),
  coinType: z.string().optional(),
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
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk();

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
  } catch (caught: unknown) {
    if (caught instanceof WalletNotFoundError)
      return errorResponse(caught, caught.message, 404);
    return errorResponse(caught, 'Failed to execute mint');
  }
}
