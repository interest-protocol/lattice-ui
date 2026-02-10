import {
  Intent,
  WITNESS_TYPE,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';
import {
  messageWithIntent,
  toSerializedSignature,
} from '@mysten/sui/cryptography';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { ENCLAVE_OBJECT_ID, createXBridgeSdk } from '@/lib/xbridge';

const enclaveUrl = process.env.ENCLAVE_URL ?? 'http://localhost:3000';

interface VoteMintBody {
  userId: string;
  requestId: string;
  depositSignature: string;
  rpcUrl?: string;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const body: VoteMintBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.requestId)
    return res.status(400).json({ error: 'Missing requestId' });
  if (!body.depositSignature)
    return res.status(400).json({ error: 'Missing depositSignature' });

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

    const enclaveResponse = await fetch(`${enclaveUrl}/xbridge/vote_mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: Array.from(
          Uint8Array.from(Buffer.from(body.requestId.slice(2), 'hex'))
        ),
        deposit_digest: body.depositSignature,
        intent: Intent.Vote,
      }),
    });

    if (!enclaveResponse.ok) {
      const err = await enclaveResponse.text();
      throw new Error(`Enclave error: ${err}`);
    }

    const proofRaw = await enclaveResponse.json();
    const proof = XBridgeInbound.parseVoteMintProof(proofRaw);

    const tx = xbridge.voteMintRequest({
      requestId: body.requestId,
      enclaveId: ENCLAVE_OBJECT_ID,
      validatorType: WITNESS_TYPE,
      signature: proof.signature,
      timestampMs: proof.timestampMs,
    });

    tx.setSender(wallet.address);

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
      options: { showEffects: true },
    });

    return res.status(200).json({ digest: txResult.digest });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to vote on mint request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
