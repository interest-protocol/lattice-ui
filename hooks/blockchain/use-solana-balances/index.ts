import { address } from '@solana/kit';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

  const queryKey = [useSolanaBalances.name, addr];

  const fetchBalances = async () => {
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

    const wsuiRaw = tokenResult.value.reduce((sum, { account }) => {
      const amount = account.data.parsed.info.tokenAmount.amount;
      return amount ? sum + BigInt(amount) : sum;
    }, 0n);

    return {
      sol: BigInt(solResult.value),
      wsui: wsuiRaw,
    };
  };

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchBalances,
    enabled: !!addr,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    staleTime: 5_000,
    structuralSharing: false,
  });

  const balances = data ?? DEFAULT_SOLANA_BALANCES;

  const amounts = {
    sol: CurrencyAmount.fromRawAmount(Token.SOL, balances.sol),
  };

  const mutate = async () => {
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: fetchBalances,
      staleTime: 0,
    });
    return result;
  };

  return {
    balances,
    amounts,
    isLoading,
    mutate,
  };
};

export default useSolanaBalances;
