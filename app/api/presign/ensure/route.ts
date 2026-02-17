import {
  ChainId as XBridgeChainId,
  WalletKey as XBridgeWalletKey,
} from '@interest-protocol/xbridge-sdk';
import {
  ChainId as XSwapChainId,
  WalletKey as XSwapWalletKey,
} from '@interest-protocol/xswap-sdk';
import { Transaction } from '@mysten/sui/transactions';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/validate-params';
import { withAuthPost } from '@/lib/api/with-auth';
import { getPrivyClient } from '@/lib/privy/server';
import {
  getWalletPublicKey,
  signAndExecuteSuiTransaction,
} from '@/lib/privy/signing';
import { getFirstWallet } from '@/lib/privy/wallet';
import { createXBridgeSdk } from '@/lib/xbridge';
import { createXSwapSdk } from '@/lib/xswap/sdk';

const schema = z.object({
  userId: z.string(),
});

const PRESIGN_COMBOS = [
  {
    app: 'xbridge',
    chainId: XBridgeChainId.Solana,
    walletKey: XBridgeWalletKey[XBridgeChainId.Solana],
  },
  {
    app: 'xbridge',
    chainId: XBridgeChainId.Sui,
    walletKey: XBridgeWalletKey[XBridgeChainId.Sui],
  },
  {
    app: 'xswap',
    chainId: XSwapChainId.Solana,
    walletKey: XSwapWalletKey[XSwapChainId.Solana],
  },
  {
    app: 'xswap',
    chainId: XSwapChainId.Sui,
    walletKey: XSwapWalletKey[XSwapChainId.Sui],
  },
] as const;

export const POST = withAuthPost(
  schema,
  async (body) => {
    try {
      const privy = getPrivyClient();
      const suiWallet = await getFirstWallet(privy, body.userId, 'sui');

      const owner = suiWallet.address;

      const { suiClient, xbridge } = createXBridgeSdk();
      const { xswap } = createXSwapSdk();

      const capCounts = await Promise.all(
        PRESIGN_COMBOS.map(async ({ app, walletKey }) => {
          const caps =
            app === 'xbridge'
              ? await xbridge
                  .getPresignCaps({ owner, walletKey })
                  .catch(() => [])
              : await xswap
                  .getPresignCaps({ owner, walletKey })
                  .catch(() => []);
          return { app, walletKey, count: caps.length };
        })
      );

      const needed = capCounts.filter((c) => c.count === 0);

      if (needed.length === 0) {
        return NextResponse.json({ taken: { xbridge: 0, xswap: 0 } });
      }

      const tx = new Transaction();
      tx.setSender(owner);

      let xbridgeTaken = 0;
      let xswapTaken = 0;

      const caps: ReturnType<typeof xbridge.takePresign>['result'][] = [];

      for (const { app, walletKey } of needed) {
        const fee = tx.splitCoins(tx.gas, [tx.pure.u64(0)]);

        if (app === 'xbridge') {
          const combo = PRESIGN_COMBOS.find(
            (c) => c.app === 'xbridge' && c.walletKey === walletKey
          );
          const { result } = xbridge.takePresign({
            tx,
            chainId: combo!.chainId,
            fee,
          });
          caps.push(result);
          xbridgeTaken++;
        } else {
          const { result } = xswap.takePresign({ tx, walletKey, fee });
          caps.push(result);
          xswapTaken++;
        }
      }

      tx.transferObjects(caps, tx.pure.address(owner));

      const publicKey = await getWalletPublicKey(privy, suiWallet.id).catch(
        () => undefined
      );

      const rawBytes = await tx.build({ client: suiClient });

      const txResult = await signAndExecuteSuiTransaction(privy, {
        walletId: suiWallet.id,
        rawBytes,
        suiClient,
        publicKey,
      });

      await suiClient.waitForTransaction({ digest: txResult.digest });

      return NextResponse.json({
        taken: { xbridge: xbridgeTaken, xswap: xswapTaken },
      });
    } catch (caught: unknown) {
      console.error('[presign/ensure] error:', caught);
      return errorResponse(caught, 'Presign ensure failed');
    }
  },
  { verifyUserId: true }
);
