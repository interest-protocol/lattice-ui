import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { ed25519 } from '@noble/curves/ed25519';
import bs58 from 'bs58';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { CHAIN_REGISTRY } from '@/constants/chains';
import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { withTimeout } from '@/lib/api/with-timeout';
import { parseUnits } from '@/lib/bigint-utils';
import { getPrivyClient } from '@/lib/privy/server';
import {
  authorizationContext,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getOrCreateWallet } from '@/lib/privy/wallet';
import {
  createRegistrySdk,
  Registry,
  SolanaPubkey,
  SuiAddress,
} from '@/lib/registry';

const MIN_GAS_BALANCE = parseUnits(
  String(CHAIN_REGISTRY.sui.minGas),
  CHAIN_REGISTRY.sui.decimals
);

const schema = z.object({
  userId: z.string(),
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

    const [suiWallet, solanaWallet] = await Promise.all([
      getOrCreateWallet(privy, body.userId, 'sui'),
      getOrCreateWallet(privy, body.userId, 'solana'),
    ]);

    const { suiClient, registry } = createRegistrySdk();

    const suiAddress = new SuiAddress(suiWallet.address);

    // Parallelize independent checks: existing link + gas balance
    const [existingLinks, { totalBalance }] = await Promise.all([
      withTimeout(
        registry.getSolanaForSui({ suiAddress }),
        15_000,
        'Registry lookup'
      ),
      withTimeout(
        suiClient.getBalance({
          owner: suiWallet.address,
          coinType: SUI_TYPE_ARG,
        }),
        10_000,
        'SUI balance check'
      ),
    ]);

    if (existingLinks.length > 0) {
      const linkedAddress = existingLinks[0].toBs58();
      return NextResponse.json({
        alreadyLinked: true,
        digest: null,
        suiAddress: suiWallet.address,
        solanaAddress: linkedAddress,
      });
    }

    if (BigInt(totalBalance) < MIN_GAS_BALANCE) {
      return NextResponse.json(
        { error: 'Insufficient SUI for gas', code: 'INSUFFICIENT_GAS' },
        { status: 402 }
      );
    }

    const messageBytes = Registry.createSolanaLinkMessage(suiWallet.address);
    const solanaPubkeyBytes = bs58.decode(solanaWallet.address);

    const signResult = await withTimeout(
      privy.wallets().solana().signMessage(solanaWallet.id, {
        message: messageBytes,
        authorization_context: authorizationContext,
      }),
      15_000,
      'Solana message signing'
    );
    const solanaSignature = Uint8Array.from(
      Buffer.from(signResult.signature, 'base64')
    );

    const localVerify = ed25519.verify(
      solanaSignature,
      messageBytes,
      solanaPubkeyBytes
    );

    if (!localVerify) {
      return NextResponse.json(
        { error: 'Solana signature verification failed locally' },
        { status: 500 }
      );
    }

    const solanaPubkey = new SolanaPubkey(solanaPubkeyBytes);
    const tx = registry.linkSolana({
      solanaPubkey,
      signature: solanaSignature,
    });

    tx.setSender(suiWallet.address);
    const rawBytes = await withTimeout(
      tx.build({ client: suiClient }),
      30_000,
      'Transaction build'
    );

    const result = await withTimeout(
      signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes,
        suiClient,
      }),
      30_000,
      'Transaction sign & execute'
    );

    await withTimeout(
      suiClient.waitForTransaction({ digest: result.digest }),
      30_000,
      'Transaction confirmation'
    );

    const verifyLinks = await withTimeout(
      registry.getSolanaForSui({ suiAddress }),
      15_000,
      'Post-link verification'
    );
    if (verifyLinks.length === 0) {
      throw new Error(
        `On-chain verification failed — no link found after tx ${result.digest}`
      );
    }

    return NextResponse.json({
      digest: result.digest,
      suiAddress: suiWallet.address,
      solanaAddress: solanaWallet.address,
    });
  } catch (caught: unknown) {
    const msg = caught instanceof Error ? caught.message : '';

    const isGasError =
      /GasBalanceTooLow|InsufficientGas|InsufficientCoinBalance|No valid gas coins/i.test(
        msg
      );
    if (isGasError) {
      return NextResponse.json(
        { error: 'Insufficient SUI for gas', code: 'INSUFFICIENT_GAS' },
        { status: 402 }
      );
    }

    const isAlreadyLinked = /already.?linked|already.?registered/i.test(msg);
    if (isAlreadyLinked) {
      return NextResponse.json({
        alreadyLinked: true,
        digest: null,
        suiAddress: null,
        solanaAddress: null,
        code: 'ALREADY_LINKED',
      });
    }

    return errorResponse(caught, 'Failed to link Solana');
  }
}
