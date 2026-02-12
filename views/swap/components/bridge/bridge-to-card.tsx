'use client';

import Image from 'next/image';
import type { FC } from 'react';

import { CHAIN_REGISTRY } from '@/constants/chains';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { formatDollars } from '@/utils';

import type { BridgeToCardProps } from './bridge.types';

const BridgeToCard: FC<BridgeToCardProps> = ({ route, amount }) => {
  const { getPrice } = useTokenPrices();
  const price = getPrice(route.sourceToken.type);
  const amountNum = Number.parseFloat(amount) || 0;
  const chainName = CHAIN_REGISTRY[route.destChain].displayName;

  return (
    <div
      className="p-5 gap-3 flex text-text-secondary rounded-2xl text-sm flex-col transition-all duration-200"
      style={{ background: 'var(--input-to-bg)' }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium tracking-wider uppercase text-text-muted">
          You receive
        </span>
        <span className="text-text-dimmed text-xs">on {chainName}</span>
      </div>

      <div className="grid max-w-full items-center gap-3 grid-cols-[1fr_auto]">
        <span className="text-text text-4xl font-light tracking-tight">
          {amountNum > 0 ? amount : '0'}
        </span>
        <div
          className="flex items-center gap-2.5 rounded-full px-3 py-2 text-text text-sm font-semibold"
          style={{
            background: 'var(--token-pill-bg)',
            border: '1px solid var(--token-pill-border)',
            boxShadow: 'var(--token-pill-shadow)',
          }}
        >
          <span className="overflow-hidden rounded-full flex w-7 h-7 min-w-7 items-center justify-center">
            <Image
              className="object-contain"
              src={route.destToken.iconUrl}
              alt={route.destToken.symbol}
              width={28}
              height={28}
            />
          </span>
          {route.destToken.symbol}
        </div>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted tabular-nums">
          {price != null && amountNum > 0
            ? formatDollars(price * amountNum, 2)
            : '—'}
        </span>
      </div>
    </div>
  );
};

export default BridgeToCard;
