import bs58 from 'bs58';
import type { NextApiHandler } from 'next';

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

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: SetMintDigestBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.requestId)
    return res.status(400).json({ error: 'Missing requestId' });
  if (!body.mintCapId)
    return res.status(400).json({ error: 'Missing mintCapId' });
  if (!body.depositSignature)
    return res.status(400).json({ error: 'Missing depositSignature' });

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

    return res.status(200).json({ digest: txResult.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to set mint digest';
    return res.status(500).json({ error: message });
  }
};

export default handler;
