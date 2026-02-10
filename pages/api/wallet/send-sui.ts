import { Transaction } from '@mysten/sui/transactions';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { getSuiClient } from '@/lib/sui/client';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId, recipient, amount, coinType, rpcUrl } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' });
  if (!recipient || typeof recipient !== 'string')
    return res.status(400).json({ error: 'Missing recipient' });
  if (!amount || typeof amount !== 'string')
    return res.status(400).json({ error: 'Missing amount' });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, userId, 'sui');

    const client = getSuiClient(rpcUrl);

    // Build the transaction
    const tx = new Transaction();
    tx.setSender(wallet.address);

    if (!coinType || coinType === '0x2::sui::SUI') {
      // Native SUI transfer
      const [coin] = tx.splitCoins(tx.gas, [BigInt(amount)]);
      tx.transferObjects([coin], recipient);
    } else {
      // Token transfer (e.g., wSOL on Sui)
      const coins = await client.getCoins({
        owner: wallet.address,
        coinType,
      });

      if (!coins.data.length)
        return res.status(400).json({ error: 'No coins of this type found' });

      const primaryCoin = tx.object(coins.data[0].coinObjectId);

      if (coins.data.length > 1) {
        tx.mergeCoins(
          primaryCoin,
          coins.data.slice(1).map((c) => tx.object(c.coinObjectId))
        );
      }

      const [splitCoin] = tx.splitCoins(primaryCoin, [BigInt(amount)]);
      tx.transferObjects([splitCoin], recipient);
    }

    const rawBytes = await tx.build({ client });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient: client,
    });

    return res.status(200).json({ digest: result.digest });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to send transaction';
    return res.status(500).json({ error: message });
  }
};

export default handler;
