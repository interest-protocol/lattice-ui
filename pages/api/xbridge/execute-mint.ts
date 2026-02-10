import { WRAPPED_SOL_OTW } from '@interest-protocol/xbridge-sdk';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
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

    const wallets = [];
    for await (const wallet of privy.wallets().list({
      user_id: body.userId,
      chain_type: 'sui',
    })) {
      wallets.push(wallet);
    }

    if (wallets.length === 0)
      return res.status(404).json({ error: 'No Sui wallet found' });

    const wallet = wallets[0];
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

    const intentMessage = messageWithIntent('TransactionData', rawBytes);
    const bytesHex = Buffer.from(intentMessage).toString('hex');

    const signResult = await privy.wallets().rawSign(wallet.id, {
      params: {
        bytes: bytesHex,
        encoding: 'hex',
        hash_function: 'blake2b256',
      },
    });

    const signatureBytes = Uint8Array.from(
      Buffer.from(signResult.signature, 'hex')
    );

    const walletInfo = await privy.wallets().get(wallet.id);
    const publicKeyBytes = Uint8Array.from(
      Buffer.from(walletInfo.public_key ?? '', 'base64')
    );
    const publicKey = new Ed25519PublicKey(publicKeyBytes);

    const serializedSignature = toSerializedSignature({
      signature: signatureBytes,
      signatureScheme: 'ED25519',
      publicKey,
    });

    const txResult = await suiClient.executeTransactionBlock({
      transactionBlock: Buffer.from(rawBytes).toString('base64'),
      signature: serializedSignature,
      options: { showEffects: true, showObjectChanges: true },
    });

    return res.status(200).json({ digest: txResult.digest });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to execute mint';
    return res.status(500).json({ error: message });
  }
};

export default handler;
