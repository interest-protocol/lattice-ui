import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { Registry, SolanaPubkey, createRegistrySdk } from '@/lib/registry';

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body;

  if (!userId || typeof userId !== 'string')
    return res.status(400).json({ error: 'Missing userId' });

  try {
    const privy = getPrivyClient();

    const suiWallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: userId,
      chain_type: 'sui',
    })) {
      suiWallets.push(wallet);
    }

    const solanaWallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: userId,
      chain_type: 'solana',
    })) {
      solanaWallets.push(wallet);
    }

    if (suiWallets.length === 0)
      return res.status(404).json({ error: 'No Sui wallet found' });
    if (solanaWallets.length === 0)
      return res.status(404).json({ error: 'No Solana wallet found' });

    const suiWallet = suiWallets[0];
    const solanaWallet = solanaWallets[0];

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
    const intentMessage = messageWithIntent('TransactionData', rawBytes);
    const bytesHex = Buffer.from(intentMessage).toString('hex');

    const suiSignResult = await privy.wallets().rawSign(suiWallet.id, {
      params: {
        bytes: bytesHex,
        encoding: 'hex',
        hash_function: 'blake2b256',
      },
    });

    const suiSignatureBytes = Uint8Array.from(
      Buffer.from(suiSignResult.signature, 'hex')
    );

    const suiWalletInfo = await privy.wallets().get(suiWallet.id);
    const suiPublicKeyBytes = Uint8Array.from(
      Buffer.from(suiWalletInfo.public_key ?? '', 'base64')
    );
    const suiPublicKey = new Ed25519PublicKey(suiPublicKeyBytes);

    const serializedSignature = toSerializedSignature({
      signature: suiSignatureBytes,
      signatureScheme: 'ED25519',
      publicKey: suiPublicKey,
    });

    const result = await suiClient.executeTransactionBlock({
      transactionBlock: Buffer.from(rawBytes).toString('base64'),
      signature: serializedSignature,
    });

    return res.status(200).json({
      digest: result.digest,
      suiAddress: suiWallet.address,
      solanaAddress: solanaWallet.address,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to link Solana';
    return res.status(500).json({ error: message });
  }
};

export default handler;
