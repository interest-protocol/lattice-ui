import { fromHex, SUI_TYPE_ARG } from '@mysten/sui/utils';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getOrCreateWallet } from '@/lib/privy/wallet';
import { createRegistrySdk, SolanaPubkey } from '@/lib/registry';

const schema = z.object({
  userId: z.string(),
  solanaSignature: z.string(),
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

    const solanaSignature = fromHex(body.solanaSignature);

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

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: suiWallet.id,
      rawBytes,
      suiClient,
    });

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

    return errorResponse(caught, 'Failed to link Solana');
  }
}
