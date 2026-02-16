import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { getPrivyClient } from '@/lib/privy/server';
import { signAndExecuteSuiTransaction } from '@/lib/privy/signing';
import { getFirstWallet, WalletNotFoundError } from '@/lib/privy/wallet';
import { getSuiClient } from '@/lib/sui/client';
import { normalizeSuiAddress } from '@/lib/sui/utils';

const schema = z.object({
  userId: z.string(),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid Sui address'),
  amount: z
    .string()
    .regex(/^\d+$/, 'Amount must be a non-negative integer string'),
  coinType: z
    .string()
    .regex(/^0x[a-fA-F0-9]+::.+::.+$/, 'Invalid Sui coin type')
    .optional(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const privy = getPrivyClient();
      const wallet = await getFirstWallet(privy, body.userId, 'sui');

      const client = getSuiClient();

      const tx = new Transaction();
      tx.setSender(wallet.address);

      const coin = coinWithBalance({
        ...(body.coinType && { type: body.coinType }),
        balance: BigInt(body.amount),
      });
      tx.transferObjects([coin], normalizeSuiAddress(body.recipient));

      const rawBytes = await tx.build({ client });

      const result = await signAndExecuteSuiTransaction(privy, {
        walletId: wallet.id,
        rawBytes,
        suiClient: client,
      });

      return NextResponse.json({ digest: result.digest }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    } catch (caught: unknown) {
      console.error('[send-sui] error:', caught);
      if (caught instanceof WalletNotFoundError)
        return errorResponse(caught, caught.message, 404);
      return errorResponse(caught, 'Failed to send transaction');
    }
  },
  { verifyUserId: true }
);
