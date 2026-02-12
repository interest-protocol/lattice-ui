'use client';

import Image from 'next/image';
import type { FC } from 'react';

import { CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeRouteSelectorProps } from './bridge.types';

const BridgeRouteSelector: FC<BridgeRouteSelectorProps> = ({
  routes,
  selectedRoute,
  routeBalances,
  onSelect,
}) => (
  <div className="flex flex-col gap-2">
    {routes.map((route) => {
      const isSelected = route.key === selectedRoute.key;
      const hasBalance = (routeBalances[route.key] ?? 0n) > 0n;
      const isDisabled = !route.enabled || !hasBalance;
      const sourceName = CHAIN_REGISTRY[route.sourceChain].displayName;
      const destName = CHAIN_REGISTRY[route.destChain].displayName;

      return (
        <button
          key={route.key}
          type="button"
          className="flex items-center gap-3 p-4 rounded-xl border-none w-full text-left focus-ring"
          style={{
            background: isSelected
              ? 'var(--color-accent-wash)'
              : 'var(--color-surface-light)',
            border: `1px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-surface-border)'}`,
            opacity: isDisabled ? 0.5 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
          }}
          onClick={() => {
            if (!isDisabled) onSelect(route);
          }}
          disabled={isDisabled}
        >
          <div className="flex items-center gap-2 flex-1">
            <Image
              src={route.sourceToken.iconUrl}
              alt={route.sourceToken.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-text font-semibold text-sm">
              {route.sourceToken.symbol}
            </span>
            <span className="text-text-muted text-sm">&#x2192;</span>
            <Image
              src={route.destToken.iconUrl}
              alt={route.destToken.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-text font-semibold text-sm">
              {route.destToken.symbol}
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-text-muted text-xs">
              {sourceName} &#x2192; {destName}
            </span>
            {!route.enabled ? (
              <span className="text-accent text-[10px] font-semibold bg-accent-wash px-1.5 py-0.5 rounded">
                Coming Soon
              </span>
            ) : !hasBalance ? (
              <span className="text-text-dimmed text-xs">No balance</span>
            ) : null}
          </div>
        </button>
      );
    })}
  </div>
);

export default BridgeRouteSelector;
