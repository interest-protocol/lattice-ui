import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { ed25519 } from '@noble/curves/ed25519';
import bs58 from 'bs58';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { PRIVY_AUTHORIZATION_KEY } from '@/lib/config.server';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getOrCreateWallet } from '@/lib/privy/wallet';
import {
  createRegistrySdk,
  Registry,
  SolanaPubkey,
  SuiAddress,
} from '@/lib/registry';

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
    const existingLinks = await registry.getSolanaForSui({
      suiAddress,
    });

    if (existingLinks.length > 0) {
      const linkedAddress = existingLinks[0].toBs58();
      return NextResponse.json({
        alreadyLinked: true,
        digest: null,
        suiAddress: suiWallet.address,
        solanaAddress: linkedAddress,
      });
    }

    const { totalBalance } = await suiClient.getBalance({
      owner: suiWallet.address,
      coinType: SUI_TYPE_ARG,
    });

    if (BigInt(totalBalance) < 1_000_000_000n) {
      return NextResponse.json(
        { error: 'Insufficient SUI for gas', code: 'INSUFFICIENT_GAS' },
        { status: 402 }
      );
    }

    const messageBytes = Registry.createSolanaLinkMessage(suiWallet.address);
    const solanaPubkeyBytes = bs58.decode(solanaWallet.address);

    const signResult = await privy
      .wallets()
      .solana()
      .signMessage(solanaWallet.id, {
        message: messageBytes,
        authorization_context: {
          authorization_private_keys: [PRIVY_AUTHORIZATION_KEY],
        },
      });
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
    const rawBytes = await tx.build({ client: suiClient });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: suiWallet.id,
      rawBytes,
      suiClient,
    });

    await suiClient.waitForTransaction({ digest: result.digest });

    const verifyLinks = await registry.getSolanaForSui({
      suiAddress,
    });
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
