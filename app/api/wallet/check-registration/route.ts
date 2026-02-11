import { type NextRequest, NextResponse } from 'next/server';

import { authenticateRequest } from '@/lib/api/auth';
import { errorResponse } from '@/lib/api/validate-params';
import { getPrivyClient } from '@/lib/privy/server';
import { createRegistrySdk, SuiAddress } from '@/lib/registry';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const privy = getPrivyClient();

    const user = await privy.users()._get(auth.userId);
    const suiAddress = user.custom_metadata?.suiAddress
      ? String(user.custom_metadata.suiAddress)
      : null;
    const solanaAddress = user.custom_metadata?.solanaAddress
      ? String(user.custom_metadata.solanaAddress)
      : null;

    const hasWallets = Boolean(suiAddress && solanaAddress);

    // If no Sui wallet, can't be registered on-chain
    if (!suiAddress) {
      return NextResponse.json({
        registered: false,
        suiAddress: null,
        solanaAddress,
        hasWallets: false,
      });
    }

    // Check on-chain link
    const { registry } = createRegistrySdk();
    const links = await registry.getSolanaForSui({
      suiAddress: new SuiAddress(suiAddress),
    });

    return NextResponse.json({
      registered: links.length > 0,
      suiAddress,
      solanaAddress: links.length > 0 ? links[0].toBs58() : solanaAddress,
      hasWallets,
    });
  } catch (caught: unknown) {
    return errorResponse(caught, 'Failed to check registration');
  }
}
