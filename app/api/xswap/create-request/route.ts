import type { ChainId } from '@interest-protocol/xswap-sdk';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { createXSwapSdk } from '@/lib/xswap';

const bigintString = z
  .string()
  .regex(/^\d+$/, 'Must be a non-negative integer');

const proofSchema = z.object({
  signature: z.array(z.number()),
  digest: z.array(z.number()),
  timestampMs: bigintString,
  dwalletAddress: z.array(z.number()),
  user: z.array(z.number()),
  chainId: z.number(),
  token: z.array(z.number()),
  amount: bigintString,
});

const schema = z.object({
  userId: z.string(),
  proof: proofSchema,
  walletKey: z.string(),
  sourceAddress: z.array(z.number()),
  sourceChain: z.number(),
  destinationChain: z.number(),
  destinationAddress: z.array(z.number()),
  destinationToken: z.array(z.number()),
  minDestinationAmount: bigintString,
  minConfirmations: z.number(),
  deadline: bigintString,
  solverSender: z.array(z.number()),
  solverRecipient: z.array(z.number()),
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

    const { suiClient, xswap } = createXSwapSdk();

    const { tx, result } = xswap.newRequest({
      params: {
        signature: new Uint8Array(body.proof.signature),
        digest: new Uint8Array(body.proof.digest),
        timestampMs: BigInt(body.proof.timestampMs),
        walletKey: BigInt(body.walletKey),
        dwalletAddress: new Uint8Array(body.proof.dwalletAddress),
        sourceAddress: new Uint8Array(body.sourceAddress),
        sourceChain: body.sourceChain as ChainId,
        sourceToken: new Uint8Array(body.proof.token),
        sourceAmount: BigInt(body.proof.amount),
        destinationChain: body.destinationChain as ChainId,
        destinationToken: new Uint8Array(body.destinationToken),
        destinationAddress: new Uint8Array(body.destinationAddress),
        minDestinationAmount: BigInt(body.minDestinationAmount),
        minConfirmations: body.minConfirmations,
        deadline: BigInt(body.deadline),
        solverSender: new Uint8Array(body.solverSender),
        solverRecipient: new Uint8Array(body.solverRecipient),
      },
    });

    tx.setSender(wallet.address);

    xswap.shareRequest({ tx, request: result });

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showObjectChanges: true },
    });

    const requestObject = txResult.objectChanges?.find(
      (change) =>
        change.type === 'created' &&
        change.objectType?.includes('::xswap::Request')
    );

    const requestId =
      requestObject && 'objectId' in requestObject
        ? requestObject.objectId
        : null;
    const requestInitialSharedVersion =
      requestObject && 'version' in requestObject
        ? requestObject.version
        : null;

    return NextResponse.json({
      digest: txResult.digest,
      requestId,
      requestInitialSharedVersion,
    });
  } catch (caught: unknown) {
    if (caught instanceof WalletNotFoundError)
      return errorResponse(caught, caught.message, 404);
    return errorResponse(caught, 'Failed to create request');
  }
}
