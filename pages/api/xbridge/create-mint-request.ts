import type { ChainId } from '@interest-protocol/xbridge-sdk';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
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
    const message =
      error instanceof Error ? error.message : 'Failed to create mint request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
