import type { ChainId } from '@interest-protocol/xswap-sdk';
import { Transaction } from '@mysten/sui/transactions';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { withTimeout } from '@/lib/api/with-timeout';
import { bigintString, byteArray } from '@/lib/api/zod-schemas';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { findCreatedObject } from '@/lib/sui/object-changes';
import { createXSwapSdk } from '@/lib/xswap';

const proofSchema = z.object({
  signature: byteArray(128),
  digest: byteArray(64),
  timestampMs: bigintString,
  dwalletAddress: byteArray(64),
  user: byteArray(64),
  chainId: z.number(),
  token: byteArray(64),
  amount: bigintString,
});

const schema = z.object({
  userId: z.string(),
  proof: proofSchema,
  walletKey: z.string(),
  sourceAddress: byteArray(64),
  sourceChain: z.number(),
  destinationChain: z.number(),
  destinationAddress: byteArray(64),
  destinationToken: byteArray(64),
  minDestinationAmount: bigintString,
  minConfirmations: z.number(),
  deadline: bigintString,
  solverSender: byteArray(64),
  solverRecipient: byteArray(64),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const privy = getPrivyClient();
      const wallet = await getFirstWallet(privy, body.userId, 'sui');

      const { suiClient, xswap } = createXSwapSdk();

      const tx = new Transaction();
      const fee = tx.splitCoins(tx.gas, [0]);

      const { result } = xswap.newRequest({
        tx,
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
        fee,
      });

      tx.setSender(wallet.address);

      xswap.shareRequest({ tx, request: result });

      const rawBytes = await withTimeout(
        tx.build({ client: suiClient }),
        30_000,
        'Transaction build'
      );

      const txResult = await withTimeout(
        signAndExecuteSuiTransaction(privy, {
          walletId: wallet.id,
          rawBytes,
          suiClient,
          options: { showObjectChanges: true },
        }),
        30_000,
        'Transaction sign & execute'
      );

      const requestObject = findCreatedObject(
        txResult.objectChanges,
        '::xswap::Request'
      );
      const requestId = requestObject?.objectId ?? null;
      const requestInitialSharedVersion = requestObject?.version ?? null;

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
  },
  { verifyUserId: true }
);
