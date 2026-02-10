import { WRAPPED_SOL_OTW } from '@interest-protocol/xbridge-sdk';
import type { NextApiHandler } from 'next';

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

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: ExecuteMintBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.requestId)
    return res.status(400).json({ error: 'Missing requestId' });
  if (!body.mintCapId)
    return res.status(400).json({ error: 'Missing mintCapId' });

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
    // Cast mintedCoin from SDK return type to Transaction argument type
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

    return res.status(200).json({ digest: txResult.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to execute mint';
    return res.status(500).json({ error: message });
  }
};

export default handler;
