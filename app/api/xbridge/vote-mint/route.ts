import { XSWAP_TYPE } from '@interest-protocol/xswap-sdk';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { ENCLAVE_API_KEY, ENCLAVE_URL } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { createXBridgeSdk, ENCLAVE_OBJECT_ID } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  requestId: z.string(),
  depositSignature: z.string(),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const { data: body, error } = validateBody(await request.json(), schema);
  if (error) return error;

  const mismatch = verifyUserMatch(auth.userId, body.userId);
  if (mismatch) return mismatch;

  try {
    const privy = getPrivyClient();
    const wallet = await getFirstWallet(privy, body.userId, 'sui');
    const { suiClient, xbridge } = createXBridgeSdk();

    // Fetch mint request on-chain to get source fields (matches core/scripts pattern)
    const mintRequest = await xbridge.getMintRequest({
      requestId: body.requestId,
    });

    // Call enclave with full request data (matches core/scripts pattern)
    const enclaveResponse = await fetch(`${ENCLAVE_URL}/xbridge/vote_mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENCLAVE_API_KEY,
      },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        request_id: body.requestId.replace(/^0x/, ''),
        chain_id: Number(mintRequest.sourceChain),
        source_token: Buffer.from(mintRequest.sourceToken).toString('hex'),
        source_decimals: mintRequest.sourceDecimals,
        source_address: Buffer.from(mintRequest.sourceAddress).toString('hex'),
        source_amount: mintRequest.sourceAmount.toString(),
        digest: body.depositSignature,
      }),
    });

    if (!enclaveResponse.ok) {
      const errorText = await enclaveResponse.text();
      throw new Error(`Enclave verification failed: ${errorText}`);
    }

    const voteData = (await enclaveResponse.json()) as {
      signature: string;
      timestamp_ms: number;
    };

    const signature = new Uint8Array(Buffer.from(voteData.signature, 'hex'));
    const timestampMs = BigInt(voteData.timestamp_ms);

    // Use XSWAP_TYPE as validator (matches core/scripts, not WITNESS_TYPE)
    const tx = xbridge.voteMintRequest({
      requestId: body.requestId,
      enclaveId: ENCLAVE_OBJECT_ID,
      validatorType: XSWAP_TYPE,
      signature,
      timestampMs,
    });

    tx.setSender(wallet.address);

    const rawBytes = await tx.build({ client: suiClient });

    const txResult = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient,
      options: { showEffects: true },
    });

    return NextResponse.json({ digest: txResult.digest });
  } catch (caught: unknown) {
    if (caught instanceof WalletNotFoundError)
      return errorResponse(caught, caught.message, 404);
    return errorResponse(caught, 'Failed to vote on mint request');
  }
}
