import type { ChainId } from '@interest-protocol/xswap-sdk';
import type { NextApiHandler } from 'next';

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

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: CreateRequestBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.proof) return res.status(400).json({ error: 'Missing proof' });

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

    return res.status(200).json({
      digest: txResult.digest,
      requestId,
      requestInitialSharedVersion,
    });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to create request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
