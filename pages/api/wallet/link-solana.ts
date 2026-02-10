import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { Registry, SolanaPubkey, createRegistrySdk } from '@/lib/registry';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' });

  try {
    const privy = getPrivyClient();
    const suiWallet = await getFirstWallet(privy, userId, 'sui');
    const solanaWallet = await getFirstWallet(privy, userId, 'solana');

    const { suiClient, registry } = createRegistrySdk();

    const messageBytes = Registry.createSolanaLinkMessage(suiWallet.address);
    const messageHex = Buffer.from(messageBytes).toString('hex');

    const solanaSignResult = await privy.wallets().rawSign(solanaWallet.id, {
      params: {
        bytes: messageHex,
        encoding: 'hex',
        hash_function: 'sha256' as const,
      },
    });

    const solanaSignature = Uint8Array.from(
      Buffer.from(solanaSignResult.signature, 'hex')
    );

    const solanaWalletInfo = await privy.wallets().get(solanaWallet.id);
    const solanaPubkeyBytes = Uint8Array.from(
      Buffer.from(solanaWalletInfo.public_key ?? '', 'base64')
    );

    const solanaPubkey = new SolanaPubkey(solanaPubkeyBytes);
    const tx = registry.linkSolana({
      solanaPubkey,
      signature: solanaSignature,
    });

    tx.setSender(suiWallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: suiWallet.id,
      rawBytes,
      suiClient,
    });

    return res.status(200).json({
      digest: result.digest,
      suiAddress: suiWallet.address,
      solanaAddress: solanaWallet.address,
    });
  } catch (error: unknown) {
    if (error instanceof WalletNotFoundError)
      return res.status(404).json({ error: error.message });
    const message =
      error instanceof Error ? error.message : 'Failed to link Solana';
    return res.status(500).json({ error: message });
  }
};

export default handler;
