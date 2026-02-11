import { Transaction } from '@mysten/sui/transactions';
import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { authenticateRequest, verifyUserMatch } from '@/lib/api/auth';
import { errorResponse, validateBody } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSuiClient } from '@/lib/sui/client';
import { coinTypeEquals, normalizeSuiAddress } from '@/utils/sui';

const schema = z.object({
  userId: z.string(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui address'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Amount must be a non-negative integer string'),
  coinType: z.string().optional(),
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

    const client = getSuiClient();

    const tx = new Transaction();
    tx.setSender(wallet.address);

    if (!body.coinType || coinTypeEquals(body.coinType, SUI_TYPE_ARG)) {
      const [coin] = tx.splitCoins(tx.gas, [BigInt(body.amount)]);
      tx.transferObjects([coin], normalizeSuiAddress(body.recipient));
    } else {
      const coins = await client.getCoins({
        owner: wallet.address,
        coinType: body.coinType,
      });

      if (!coins.data.length)
        return NextResponse.json(
          { error: 'No coins of this type found' },
          { status: 400 }
        );

      const primaryCoin = tx.object(coins.data[0].coinObjectId);

      if (coins.data.length > 1) {
        tx.mergeCoins(
          primaryCoin,
          coins.data.slice(1).map((c) => tx.object(c.coinObjectId))
        );
      }

      const [splitCoin] = tx.splitCoins(primaryCoin, [BigInt(body.amount)]);
      tx.transferObjects([splitCoin], body.recipient);
    }

    const rawBytes = await tx.build({ client });

    const result = await signAndExecuteSuiTransaction(privy, {
      walletId: wallet.id,
      rawBytes,
      suiClient: client,
    });

    return NextResponse.json({ digest: result.digest });
  } catch (caught: unknown) {
    if (caught instanceof WalletNotFoundError)
      return errorResponse(caught, caught.message, 404);
    return errorResponse(caught, 'Failed to send transaction');
  }
}
