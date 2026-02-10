import { PrivyClient } from '@privy-io/node';

import { PRIVY_APP_ID } from '@/lib/config';
import { PRIVY_APP_SECRET } from '@/lib/config.server';

let privyClient: PrivyClient | null = null;

export const getPrivyClient = (): PrivyClient => {
  if (!privyClient) {
    privyClient = new PrivyClient({
      appId: PRIVY_APP_ID,
      appSecret: PRIVY_APP_SECRET,
    });
  }

  return privyClient;
};
