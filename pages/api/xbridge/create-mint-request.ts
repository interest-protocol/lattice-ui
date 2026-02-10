import type { ChainId } from '@interest-protocol/xbridge-sdk';
import { Transaction } from '@mysten/sui/transactions';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';

interface CreateMintRequestBody {
  userId: string;
  sourceChain: number;
  sourceToken: number[];
  sourceDecimals: number;
  sourceAddress: number[];
  sourceAmount: string;
  coinType: string;
  rpcUrl?: string;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: CreateMintRequestBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.sourceToken)
    return res.status(400).json({ error: 'Missing sourceToken' });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk(body.rpcUrl);

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

    return res
      .status(200)
      .json({ digest: txResult.digest, requestId, mintCapId });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to create mint request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
