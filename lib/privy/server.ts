import { PrivyClient } from '@privy-io/node';
import invariant from 'tiny-invariant';

import { PRIVY_APP_ID } from '@/lib/config';

let privyClient: PrivyClient | null = null;

export const getPrivyClient = (): PrivyClient => {
  if (!privyClient) {
    const appSecret = process.env.PRIVY_APP_SECRET ?? '';
    invariant(appSecret, 'PRIVY_APP_SECRET not configured');

    privyClient = new PrivyClient({ appId: PRIVY_APP_ID, appSecret });
  }

  return privyClient;
};
