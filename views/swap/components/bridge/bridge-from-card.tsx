'use client';

import Image from 'next/image';
import type { ChangeEvent, FC } from 'react';

import {
  ChevronDownSVG,
  PizzaPart25PercentSVG,
  PizzaPart50PercentSVG,
  PizzaPart100PercentSVG,
} from '@/components/ui/icons';
import type { SVGProps } from '@/components/ui/icons/icons.types';
import { CHAIN_REGISTRY } from '@/constants/chains';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatDollars, formatMoney } from '@/utils';
import { parseInputEventToNumberString } from '@/utils/number';

import type { BridgeFromCardProps } from './bridge.types';

const PIZZA_ICONS: Record<number, FC<SVGProps>> = {
  0.25: PizzaPart25PercentSVG,
  0.5: PizzaPart50PercentSVG,
  1: PizzaPart100PercentSVG,
};

const FACTOR_DIVISORS: Record<number, bigint> = {
  0.25: 4n,
  0.5: 2n,
  1: 1n,
};

const BridgeFromCard: FC<BridgeFromCardProps> = ({
  route,
  amount,
  setAmount,
  balance,
  balanceLoading,
  onOpenRouteSelector,
}) => {
  const { getPrice } = useTokenPrices();
  const price = getPrice(route.sourceToken.type);
  const amountNum = Number.parseFloat(amount) || 0;
  const chainName = CHAIN_REGISTRY[route.sourceChain].displayName;
  const balanceFormatted = formatMoney(
    FixedPointMath.toNumber(balance, route.sourceToken.decimals)
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(parseInputEventToNumberString(e));
  };

  const handleSetPortion = (divisor: bigint) => {
    const scaled = balance / divisor;
    setAmount(
      FixedPointMath.toNumber(scaled, route.sourceToken.decimals).toString()
    );
  };

  return (
    <div
      className="p-4 gap-3 flex text-text-secondary rounded-xl text-sm flex-col border border-surface-border transition-all duration-200 focus-within:border-accent-border"
      style={{ background: 'var(--color-surface-inset)' }}
    >
      <div className="flex justify-between items-center">
        <span className="opacity-80">You send</span>
        <div className="flex gap-2">
          {([0.25, 0.5, 1] as const).map((factor) => {
            const Icon = PIZZA_ICONS[factor];
            const divisor = FACTOR_DIVISORS[factor];
            return (
              <button
                type="button"
                key={factor}
                className="flex gap-2 cursor-pointer hover:text-accent bg-transparent border-none p-0 text-inherit"
                onClick={() => handleSetPortion(divisor)}
              >
                <span className="font-mono">{factor * 100}%</span>
                <Icon maxWidth="1rem" width="100%" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid max-w-full items-center font-mono grid-cols-[1fr_auto]">
        <input
          className="appearance-none bg-transparent border-none outline-none text-text min-w-full text-2xl"
          placeholder="0"
          autoComplete="off"
          value={amount}
          onChange={handleChange}
        />
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer bg-transparent border-none p-0 text-text text-base"
          onClick={onOpenRouteSelector}
          aria-label={`Select ${route.sourceToken.symbol}`}
        >
          <span className="overflow-hidden rounded-full flex w-8 h-8 min-w-8 items-center justify-center ring-1 ring-surface-border">
            <Image
              className="object-contain"
              src={route.sourceToken.iconUrl}
              alt={route.sourceToken.symbol}
              width={32}
              height={32}
            />
          </span>
          {route.sourceToken.symbol}
          <ChevronDownSVG maxWidth="1rem" width="100%" />
        </button>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-mono">
          {price != null && amountNum > 0
            ? formatDollars(price * amountNum, 2)
            : '—'}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="cursor-pointer hover:text-accent bg-transparent border-none p-0 text-inherit"
            onClick={() => handleSetPortion(1n)}
          >
            {balanceLoading
              ? '...'
              : `${balanceFormatted} ${route.sourceToken.symbol}`}
          </button>
          <span className="text-text-dimmed text-xs ml-1">on {chainName}</span>
        </div>
      </div>
    </div>
  );
};

export default BridgeFromCard;
