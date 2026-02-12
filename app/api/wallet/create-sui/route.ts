import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { getPrivyClient } from '@/lib/privy/server';
import { getOrCreateWallet } from '@/lib/privy/wallet';

const schema = z.object({
  userId: z.string(),
});

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const privy = getPrivyClient();

      const wallet = await getOrCreateWallet(privy, body.userId, 'sui');

      return NextResponse.json({
        id: wallet.id,
        address: wallet.address,
        chainType: wallet.chain_type,
      });
    } catch (caught: unknown) {
      return errorResponse(caught, 'Failed to create wallet');
    }
  },
  { verifyUserId: true }
);
