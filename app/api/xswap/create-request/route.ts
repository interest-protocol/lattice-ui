import type { ChainId } from '@interest-protocol/xswap-sdk';
import { type NextRequest, NextResponse } from 'next/server';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { createXSwapSdk } from '@/lib/xswap';

interface RequestProof {
  signature: number[];
  digest: number[];
  timestampMs: string;
  dwalletAddress: number[];
  user: number[];
  chainId: number;
  token: number[];
  amount: string;
}

interface CreateRequestBody {
  userId: string;
  proof: RequestProof;
  walletKey: string;
  sourceAddress: number[];
  sourceChain: number;
  destinationChain: number;
  destinationAddress: number[];
  destinationToken: number[];
  minDestinationAmount: string;
  minConfirmations: number;
  deadline: string;
  solverSender: number[];
  solverRecipient: number[];
  rpcUrl?: string;
}

export async function POST(request: NextRequest) {
  const body: CreateRequestBody = await request.json();

  if (!body.userId)
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  if (!body.proof)
    return NextResponse.json({ error: 'Missing proof' }, { status: 400 });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');

    const { suiClient, xswap } = createXSwapSdk(body.rpcUrl);

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
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return NextResponse.json({ error: error.message }, { status: 404 });
    const message =
      error instanceof Error ? error.message : 'Failed to create request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
