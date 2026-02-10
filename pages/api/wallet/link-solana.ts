import { messageWithIntent, toSerializedSignature } from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { getSuiClient } from '@/lib/xbridge/sui-client';

const REGISTRY_PACKAGE_ID =
  '0x0627db9e69f072af2119cbdc744b06216e67bc685d75ead2b0d9a5f7a5e0dca5';
const REGISTRY_OBJECT_ID =
  '0xe785fd9e5e8797bec0e5dbace1c4be4c787681f97c9c56ca7444fcc8ba72a330';
const REGISTRY_INITIAL_SHARED_VERSION = '779879272';

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

    const client = getSuiClient();

    const suiAddressHex = suiWallet.address.replace(/^0x/, '');
    const linkMessage = `Link Solana to Sui: ${suiAddressHex}`;
    const messageBytes = new TextEncoder().encode(linkMessage);
    const messageHex = Buffer.from(messageBytes).toString('hex');

    const solanaSignResult = await privy.wallets().rawSign(solanaWallet.id, {
      params: {
        bytes: messageHex,
        encoding: 'hex',
        hash_function: 'none',
      },
    });

    const solanaSignature = Uint8Array.from(
      Buffer.from(solanaSignResult.signature, 'hex')
    );

    const solanaWalletInfo = await privy.wallets().get(solanaWallet.id);
    const solanaPubkeyBytes = Uint8Array.from(
      Buffer.from(solanaWalletInfo.public_key ?? '', 'base64')
    );

    const tx = new Transaction();
    tx.setSender(suiWallet.address);

    tx.moveCall({
      target: `${REGISTRY_PACKAGE_ID}::registry::link_solana`,
      arguments: [
        tx.sharedObjectRef({
          objectId: REGISTRY_OBJECT_ID,
          initialSharedVersion: REGISTRY_INITIAL_SHARED_VERSION,
          mutable: true,
        }),
        tx.pure('vector<u8>', Array.from(solanaPubkeyBytes)),
        tx.pure('vector<u8>', Array.from(solanaSignature)),
      ],
    });

    const rawBytes = await tx.build({ client });
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

    const result = await client.executeTransactionBlock({
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
