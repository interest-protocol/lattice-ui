'use client';

import Image from 'next/image';
import type { FC } from 'react';
import Skeleton from 'react-loading-skeleton';

import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { formatDollars } from '@/utils/money';

const CHAINS: ReadonlyArray<ChainKey> = ['sui', 'solana'];

const Footer: FC = () => {
  const { getPrice, isLoading } = useTokenPrices();

  return (
    <footer className="sticky bottom-0 z-40 mt-auto bg-surface/80 backdrop-blur-md border-t border-surface-border">
      <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-4 px-4 py-2">
        {CHAINS.map((chain, i) => {
          const config = CHAIN_REGISTRY[chain];
          const price = getPrice(config.nativeTokenType);

          return (
            <div key={chain} className="flex items-center gap-3">
              {i > 0 && <span className="text-text-dimmed select-none">|</span>}
              <div className="flex items-center gap-1.5">
                <Image
                  src={config.nativeToken.iconUrl}
                  alt={config.nativeToken.symbol}
                  width={14}
                  height={14}
                  className="rounded-full"
                />
                <span
                  className="text-xs font-semibold"
                  style={{ color: config.color }}
                >
                  {config.nativeToken.symbol}
                </span>
                {isLoading ? (
                  <Skeleton width="2.5rem" height="0.75rem" />
                ) : (
                  <span className="text-xs text-text-muted">
                    {formatDollars(price, 2)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </footer>
  );
};

export default Footer;
