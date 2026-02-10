import { PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import useSWR from 'swr';

import { WSUI_SOLANA_MINT } from '@/constants';
import useSolanaConnection from '@/hooks/use-solana-connection';
import { balanceSwrConfig } from '@/lib/swr/config';

const DEFAULT_SOLANA_BALANCES = { sol: new BigNumber(0), wsui: new BigNumber(0) };

const useSolanaBalances = (address: string | null) => {
  const connection = useSolanaConnection();

  const { data, isLoading, mutate } = useSWR(
    address ? [useSolanaBalances.name, address] : null,
    async ([, addr]) => {
      const pubkey = new PublicKey(addr);
      const wsuiMint = new PublicKey(WSUI_SOLANA_MINT);

      const [solLamports, tokenAccounts] = await Promise.all([
        connection.getBalance(pubkey),
        connection.getParsedTokenAccountsByOwner(pubkey, { mint: wsuiMint }),
      ]);

      let wsuiRaw = new BigNumber(0);
      for (const { account } of tokenAccounts.value) {
        const parsed = account.data.parsed;
        if (parsed?.info?.tokenAmount?.amount) {
          wsuiRaw = wsuiRaw.plus(parsed.info.tokenAmount.amount);
        }
      }

      return {
        sol: new BigNumber(solLamports),
        wsui: wsuiRaw,
      };
    },
    balanceSwrConfig
  );

  const balances = useMemo(() => data ?? DEFAULT_SOLANA_BALANCES, [data]);

  return {
    balances,
    isLoading,
    mutate,
  };
};

export default useSolanaBalances;
