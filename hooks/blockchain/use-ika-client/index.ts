import { getNetworkConfig, IkaClient } from '@ika.xyz/sdk';
import type { SuiClient } from '@mysten/sui/client';
import { useEffect, useRef } from 'react';

import useSuiClient from '@/hooks/blockchain/use-sui-client';

interface IkaClientState {
  suiClient: SuiClient | null;
  client: IkaClient | null;
  promise: Promise<IkaClient> | null;
}

const useIkaClient = () => {
  const suiClient = useSuiClient();
  const stateRef = useRef<IkaClientState>({
    suiClient: null,
    client: null,
    promise: null,
  });

  const ensureClient = async (): Promise<IkaClient> => {
    if (stateRef.current.suiClient !== suiClient) {
      stateRef.current = { suiClient, client: null, promise: null };
    }

    const current = stateRef.current;
    if (current.client) return current.client;

    if (!current.promise) {
      current.promise = (async () => {
        try {
          const client = new IkaClient({
            suiClient,
            config: getNetworkConfig('mainnet'),
          });
          await client.initialize();
          current.client = client;
          return client;
        } catch (err) {
          current.client = null;
          current.promise = null;
          throw err;
        }
      })();
    }
    return current.promise;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: React Compiler memoizes ensureClient; suiClient is the real trigger
  useEffect(() => {
    ensureClient().catch(console.error);
  }, [suiClient]);

  return ensureClient;
};

export default useIkaClient;
