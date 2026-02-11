import type { ChainId } from '@interest-protocol/xbridge-sdk';
import { Transaction } from '@mysten/sui/transactions';
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
  sourceChain: z.number(),
  sourceToken: z.array(z.number()),
  sourceDecimals: z.number(),
  sourceAddress: z.array(z.number()),
  sourceAmount: z.string().regex(/^\d+$/, 'Must be a non-negative integer'),
  coinType: z.string(),
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

    const tx = new Transaction();
    tx.setSender(wallet.address);

    const feeCoin = tx.splitCoins(tx.gas, [tx.pure.u64(1_000_000)]);

    const { result: mintRequest, mintCap } = xbridge.newMintRequest({
      tx,
      sourceChain: body.sourceChain as ChainId,
      sourceToken: new Uint8Array(body.sourceToken),
      sourceDecimals: body.sourceDecimals,
      sourceAddress: new Uint8Array(body.sourceAddress),
      sourceAmount: BigInt(body.sourceAmount),
      fee: feeCoin,
      coinType: body.coinType,
    });

    xbridge.shareMintRequest({ tx, request: mintRequest });
    tx.transferObjects([mintCap], wallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showObjectChanges: true },
    });

    const requestObject = txResult.objectChanges?.find(
      (c) => c.type === 'created' && c.objectType?.includes('MintRequest')
    );

    const mintCapObject = txResult.objectChanges?.find(
      (c) => c.type === 'created' && c.objectType?.includes('MintCap')
    );

    const requestId =
      requestObject && 'objectId' in requestObject
        ? requestObject.objectId
        : null;

    const mintCapId =
      mintCapObject && 'objectId' in mintCapObject
        ? mintCapObject.objectId
        : null;

    return NextResponse.json({ digest: txResult.digest, requestId, mintCapId });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return errorResponse(error, error.message, 404);
    return errorResponse(error, 'Failed to create mint request');
  }
}
