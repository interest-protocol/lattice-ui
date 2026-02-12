'use client';

import { motion } from 'motion/react';
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
      className="p-5 gap-3 flex text-text-secondary rounded-2xl text-sm flex-col transition-colors duration-200"
      style={{ background: 'var(--input-from-bg)' }}
    >
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium tracking-wider uppercase text-text-muted">
          You send
        </span>
        <div className="flex gap-1.5 items-center">
          {([0.25, 0.5, 1] as const).map((factor) => {
            const Icon = PIZZA_ICONS[factor];
            const divisor = FACTOR_DIVISORS[factor];
            return (
              <button
                type="button"
                key={factor}
                aria-label={`Use ${factor * 100}% of balance`}
                className="flex gap-1.5 items-center cursor-pointer hover:text-accent hover:bg-accent-wash bg-transparent border-none rounded-md px-1.5 py-0.5 text-text-muted text-xs transition-colors duration-150 focus-ring"
                onClick={() => handleSetPortion(divisor)}
              >
                <span className="tabular-nums">{factor * 100}%</span>
                <Icon maxWidth="0.75rem" width="100%" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid max-w-full items-center gap-3 grid-cols-[1fr_auto]">
        <input
          className="appearance-none bg-transparent border-none outline-none focus-visible:ring-2 focus-visible:ring-accent-border rounded text-text min-w-full text-4xl font-light tracking-tight placeholder:text-text-dimmed"
          placeholder="0"
          autoComplete="off"
          value={amount}
          onChange={handleChange}
        />
        <motion.button
          type="button"
          className="flex items-center gap-2.5 cursor-pointer rounded-full px-3 py-2 border-none text-text text-sm font-semibold"
          style={{
            background: 'var(--token-pill-bg)',
            border: '1px solid var(--token-pill-border)',
            boxShadow: 'var(--token-pill-shadow)',
          }}
          onClick={onOpenRouteSelector}
          aria-label={`Select ${route.sourceToken.symbol}`}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <span className="overflow-hidden rounded-full flex w-7 h-7 min-w-7 items-center justify-center">
            <Image
              className="object-contain"
              src={route.sourceToken.iconUrl}
              alt={route.sourceToken.symbol}
              width={28}
              height={28}
            />
          </span>
          {route.sourceToken.symbol}
          <span className="text-text-muted">
            <ChevronDownSVG maxWidth="0.75rem" width="100%" />
          </span>
        </motion.button>
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-text-muted tabular-nums">
          {price != null && amountNum > 0
            ? formatDollars(price * amountNum, 2)
            : '—'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="cursor-pointer hover:text-accent bg-transparent border-none p-0 text-text-muted text-xs tabular-nums transition-colors duration-150"
            onClick={() => handleSetPortion(1n)}
          >
            {balanceLoading
              ? '...'
              : `${balanceFormatted} ${route.sourceToken.symbol}`}
          </button>
          <span className="text-text-dimmed text-xs">on {chainName}</span>
        </div>
      </div>
    </div>
  );
};

export default BridgeFromCard;
