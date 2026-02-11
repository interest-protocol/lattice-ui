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
      className="p-4 gap-3 flex text-text-secondary rounded-xl text-sm flex-col border border-surface-border transition-all duration-200"
      style={{ background: 'var(--color-surface-inset)' }}
    >
      <div className="flex justify-between items-center">
        <span className="opacity-80">You receive</span>
        <span className="text-text-dimmed text-xs">on {chainName}</span>
      </div>

      <div className="grid max-w-full items-center font-mono grid-cols-[1fr_auto]">
        <span className="text-text text-2xl">
          {amountNum > 0 ? amount : '0'}
        </span>
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Image
            src={route.destToken.iconUrl}
            alt={route.destToken.symbol}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-text font-semibold text-sm">
            {route.destToken.symbol}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-mono">
          {price != null && amountNum > 0
            ? formatDollars(price * amountNum, 2)
            : '—'}
        </span>
      </div>
    </div>
  );
};

export default BridgeToCard;
