'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import type { FC } from 'react';
import Skeleton from 'react-loading-skeleton';

import useGasDisplay from '@/hooks/domain/use-gas-display';

const GasBalances: FC = () => {
  const { authenticated } = usePrivy();
  const items = useGasDisplay();

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
