import { PrivyClient } from '@privy-io/node';

import { PRIVY_APP_ID } from '@/lib/config';

let privyClient: PrivyClient | null = null;

export const getPrivyClient = (): PrivyClient => {
  if (!privyClient) {
    const appSecret = process.env.PRIVY_APP_SECRET ?? '';

    if (!appSecret) {
      throw new Error('PRIVY_APP_SECRET not configured');
    }

    privyClient = new PrivyClient({ appId: PRIVY_APP_ID, appSecret });
  }

  return privyClient;
};
