import {
  Intent,
  WITNESS_TYPE,
  XBridgeInbound,
} from '@interest-protocol/xbridge-sdk';
import type { NextApiHandler } from 'next';

import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { WalletNotFoundError, getFirstWallet } from '@/lib/privy/wallet';
import { ENCLAVE_OBJECT_ID, createXBridgeSdk } from '@/lib/xbridge';

interface VoteMintBody {
  userId: string;
  requestId: string;
  depositSignature: string;
  rpcUrl?: string;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ENCLAVE_URL)
    return res.status(500).json({ error: 'ENCLAVE_URL not configured' });

  const enclaveUrl = process.env.ENCLAVE_URL;
  const body: VoteMintBody = req.body;

  if (!body.userId) return res.status(400).json({ error: 'Missing userId' });
  if (!body.requestId)
    return res.status(400).json({ error: 'Missing requestId' });
  if (!body.depositSignature)
    return res.status(400).json({ error: 'Missing depositSignature' });

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk(body.rpcUrl);

    const enclaveResponse = await fetch(`${enclaveUrl}/xbridge/vote_mint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10_000),
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
      error instanceof Error ? error.message : 'Failed to vote on mint request';
    return res.status(500).json({ error: message });
  }
};

export default handler;
