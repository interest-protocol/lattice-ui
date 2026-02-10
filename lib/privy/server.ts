import { PrivyClient } from '@privy-io/node';

let privyClient: PrivyClient | null = null;

export const getPrivyClient = (): PrivyClient => {
  if (!privyClient) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? '';
    const appSecret = process.env.PRIVY_APP_SECRET ?? '';

    if (!appSecret) {
      throw new Error('PRIVY_APP_SECRET not configured');
    }

    privyClient = new PrivyClient({ appId, appSecret });
  }

  return privyClient;
};
