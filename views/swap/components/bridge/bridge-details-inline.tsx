'use client';

import { AnimatePresence } from 'motion/react';
import type { FC } from 'react';

import Motion from '@/components/ui/motion';
import { CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeDetailsInlineProps } from './bridge.types';

const BridgeDetailsInline: FC<BridgeDetailsInlineProps> = ({
  route,
  amount,
}) => {
  const amountNum = Number.parseFloat(amount) || 0;
  const sourceName = CHAIN_REGISTRY[route.sourceChain].displayName;
  const destName = CHAIN_REGISTRY[route.destChain].displayName;

  return (
    <AnimatePresence>
      {amountNum > 0 && (
        <Motion
          className="flex justify-between items-center px-4 py-3 text-xs text-text-muted bg-surface-light rounded-xl border border-surface-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <span>
            Route: {sourceName} &#x2192; {destName}
          </span>
          <span>Fee: --</span>
          <span>~2-5 min</span>
        </Motion>
      )}
    </AnimatePresence>
  );
};

export default BridgeDetailsInline;
