'use client';

import Image from 'next/image';
import type { FC } from 'react';
import Skeleton from 'react-loading-skeleton';

import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useBalances from '@/hooks/domain/use-balances';
import { FixedPointMath } from '@/lib/entities';
import { formatMoney } from '@/utils/money';

const CHAINS: readonly ChainKey[] = ['sui', 'solana'];

const GasBalancesInline: FC = () => {
  const { suiBalances, solanaBalances, suiLoading, solLoading } = useBalances();

  const items = CHAINS.map((chain) => {
    const config = CHAIN_REGISTRY[chain];
    const raw = chain === 'sui' ? suiBalances.sui : solanaBalances.sol;
    const amount = FixedPointMath.toNumber(raw, config.decimals);
    const display = formatMoney(amount, config.displayPrecision);
    const loading = chain === 'sui' ? suiLoading : solLoading;

    return { chain, config, display, loading };
  });

  return (
    <div className="px-4 py-2 flex flex-col gap-2">
      <span className="text-text-muted text-xs font-medium">Gas Balances</span>
      <div className="flex items-center gap-4">
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
              <span className="font-mono text-xs text-text">
                {display} {config.nativeToken.symbol}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GasBalancesInline;
