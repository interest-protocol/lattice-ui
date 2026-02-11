'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import type { FC } from 'react';
import Skeleton from 'react-loading-skeleton';

import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities';
import { formatMoney } from '@/utils/money';

const CHAINS: ReadonlyArray<ChainKey> = ['sui', 'solana'];

const GasBalances: FC = () => {
  const { authenticated } = usePrivy();
  const { getAddress } = useWalletAddresses();

  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const items = CHAINS.map((chain) => {
    const config = CHAIN_REGISTRY[chain];
    const raw = chain === 'sui' ? suiBalances.sui : solanaBalances.sol;
    const amount = FixedPointMath.toNumber(raw, config.decimals);
    const display = formatMoney(amount, config.displayPrecision);
    const loading = chain === 'sui' ? suiLoading : solLoading;

    return { chain, config, display, loading };
  });

  if (!authenticated) return null;

  return (
    <div className="hidden sm:flex items-center gap-3">
      {items.map(({ chain, config, display, loading }) => (
        <div key={chain} className="flex items-center gap-1.5">
          <Image
            src={config.nativeToken.iconUrl}
            alt={config.nativeToken.symbol}
            width={16}
            height={16}
            className="rounded-full"
          />
          {loading ? (
            <Skeleton width="2.5rem" height="0.75rem" />
          ) : (
            <span className="font-mono text-xs text-text-muted">{display}</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default GasBalances;
