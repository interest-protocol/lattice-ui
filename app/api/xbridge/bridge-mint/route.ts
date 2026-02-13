import type { ChainId } from '@interest-protocol/xbridge-sdk';
import { XSWAP_TYPE } from '@interest-protocol/xswap-sdk';
import { Transaction } from '@mysten/sui/transactions';
import { fromHex, toHex } from '@mysten/sui/utils';
import bs58 from 'bs58';
import { NextResponse } from 'next/server';
import invariant from 'tiny-invariant';
import { z } from 'zod';

import { fetchWithRetry } from '@/lib/api/fetch-with-retry';
import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { ENCLAVE_API_KEY, ENCLAVE_URL } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import {
  extractPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { findCreatedObjectId } from '@/lib/sui/object-changes';
import { createXBridgeSdk, ENCLAVE_OBJECT_ID } from '@/lib/xbridge';

const schema = z.object({
  userId: z.string(),
  sourceChain: z.number(),
  sourceToken: z.array(z.number()),
  sourceDecimals: z.number(),
  sourceAddress: z.array(z.number()),
  sourceAmount: z.string().regex(/^\d+$/, 'Must be a non-negative integer'),
  coinType: z.string(),
  depositSignature: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    let requestId: string | null = null;
    let mintCapId: string | null = null;

    try {
      const privy = getPrivyClient();
      const wallet = await getFirstWallet(privy, body.userId, 'sui');
      const { suiClient, xbridge } = createXBridgeSdk();

      // Pre-fetch public key once for both transactions
      const walletInfo = await privy.wallets().get(wallet.id);
      invariant(walletInfo.public_key, `Wallet ${wallet.id} has no public key`);
      const publicKey = extractPublicKey(walletInfo.public_key);

      // === Sui Tx 1: create + share mint request + transfer mint cap ===
      const tx1 = new Transaction();
      tx1.setSender(wallet.address);

      const feeCoin = tx1.splitCoins(tx1.gas, [tx1.pure.u64(0)]);

      const { result: mintRequest, mintCap } = xbridge.newMintRequest({
        tx: tx1,
        sourceChain: body.sourceChain as ChainId,
        sourceToken: new Uint8Array(body.sourceToken),
        sourceDecimals: body.sourceDecimals,
        sourceAddress: new Uint8Array(body.sourceAddress),
        sourceAmount: BigInt(body.sourceAmount),
        fee: feeCoin,
        coinType: body.coinType,
      });

      xbridge.shareMintRequest({ tx: tx1, request: mintRequest });
      tx1.transferObjects([mintCap], wallet.address);

      const rawBytes1 = await tx1.build({ client: suiClient });

      const tx1Result = await signAndExecuteSuiTransaction(privy, {
        walletId: wallet.id,
        rawBytes: rawBytes1,
        suiClient,
        publicKey,
        options: { showObjectChanges: true },
      });

      requestId = findCreatedObjectId(tx1Result.objectChanges, 'MintRequest');
      mintCapId = findCreatedObjectId(tx1Result.objectChanges, 'MintCap');

      invariant(
        requestId && mintCapId,
        'Failed to extract requestId or mintCapId from tx1'
      );

      // Wait for tx1 to be indexed before the enclave tries to read it on-chain
      await suiClient.waitForTransaction({ digest: tx1Result.digest });

      // === Enclave: get vote signature (with retry for RPC propagation) ===
      const sourceTokenHex = toHex(new Uint8Array(body.sourceToken));
      const sourceAddressHex = toHex(new Uint8Array(body.sourceAddress));

      const enclaveResponse = await fetchWithRetry(
        `${ENCLAVE_URL}/xbridge/vote_mint`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': ENCLAVE_API_KEY,
          },
          signal: AbortSignal.timeout(10_000),
          body: JSON.stringify({
            request_id: requestId.replace(/^0x/, ''),
            chain_id: body.sourceChain,
            source_token: sourceTokenHex,
            source_decimals: body.sourceDecimals,
            source_address: sourceAddressHex,
            source_amount: body.sourceAmount,
            digest: body.depositSignature,
          }),
        }
      );

      const voteData = (await enclaveResponse.json()) as {
        signature: string;
        timestamp_ms: number;
      };

      const signature = fromHex(voteData.signature);
      const timestampMs = BigInt(voteData.timestamp_ms);

      // === Sui Tx 2: setDigest + vote + execute (combined PTB) ===
      const tx2 = new Transaction();
      tx2.setSender(wallet.address);

      xbridge.setMintDigest({
        tx: tx2,
        requestId,
        mintCapId,
        digest: bs58.decode(body.depositSignature),
      });

      xbridge.voteMintRequest({
        tx: tx2,
        requestId,
        enclaveId: ENCLAVE_OBJECT_ID,
        validatorType: XSWAP_TYPE,
        signature,
        timestampMs,
      });

      const { result: mintedCoin } = xbridge.executeMintRequest({
        tx: tx2,
        requestId,
        mintCapId,
        coinType: body.coinType,
      });

      tx2.transferObjects(
        [mintedCoin as Parameters<typeof tx2.transferObjects>[0][0]],
        wallet.address
      );

      const rawBytes2 = await tx2.build({ client: suiClient });

      const tx2Result = await signAndExecuteSuiTransaction(privy, {
        walletId: wallet.id,
        rawBytes: rawBytes2,
        suiClient,
        publicKey,
        options: { showEffects: true },
      });

      return NextResponse.json({
        digest: tx2Result.digest,
        requestId,
        mintCapId,
        createDigest: tx1Result.digest,
      });
    } catch (caught: unknown) {
      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);

      // If tx1 succeeded but a later phase failed, include recovery info
      if (requestId && mintCapId) {
        const message =
          caught instanceof Error ? caught.message : 'Bridge mint failed';
        return NextResponse.json(
          { error: message, phase: 'post-create', requestId, mintCapId },
          { status: 500 }
        );
      }

      return errorResponse(caught, 'Bridge mint failed');
    }
  },
  { verifyUserId: true }
);
