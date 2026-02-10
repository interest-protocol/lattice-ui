import { address } from '@solana/kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { WSUI_SOLANA_MINT } from '@/constants';
import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import { CurrencyAmount, Token } from '@/lib/entities';

const DEFAULT_SOLANA_BALANCES = {
  sol: 0n,
  wsui: 0n,
};

const useSolanaBalances = (addr: string | null) => {
  const rpc = useSolanaRpc();
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => [useSolanaBalances.name, addr], [addr]);

  const fetchBalances = useCallback(async () => {
    if (!addr) return DEFAULT_SOLANA_BALANCES;
    const pubkey = address(addr);
    const wsuiMint = address(WSUI_SOLANA_MINT);

    const [solResult, tokenResult] = await Promise.all([
      rpc.getBalance(pubkey, { commitment: 'confirmed' }).send(),
      rpc
        .getTokenAccountsByOwner(
          pubkey,
          { mint: wsuiMint },
          { encoding: 'jsonParsed', commitment: 'confirmed' }
        )
        .send(),
    ]);

    let wsuiRaw = 0n;
    for (const { account } of tokenResult.value) {
      const parsed = (account.data as any).parsed;
      if (parsed?.info?.tokenAmount?.amount) {
        wsuiRaw += BigInt(parsed.info.tokenAmount.amount);
      }
    }

    return {
      sol: BigInt(solResult.value),
      wsui: wsuiRaw,
    };
  }, [rpc, addr]);

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchBalances,
    enabled: !!addr,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    structuralSharing: false,
  });

  const balances = useMemo(() => data ?? DEFAULT_SOLANA_BALANCES, [data]);

  const amounts = useMemo(
    () => ({
      sol: CurrencyAmount.fromRawAmount(Token.SOL, balances.sol),
    }),
    [balances.sol]
  );

  const mutate = useCallback(async () => {
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: fetchBalances,
      staleTime: 0,
    });
    return result;
  }, [queryClient, queryKey, fetchBalances]);

  return {
    balances,
    amounts,
    isLoading,
    mutate,
  };
};

export default useSolanaBalances;
