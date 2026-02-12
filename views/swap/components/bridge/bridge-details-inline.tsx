'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type FC, useState } from 'react';

import { ChevronDownSVG } from '@/components/ui/icons';
import { CHAIN_REGISTRY } from '@/constants/chains';

import type { BridgeDetailsInlineProps } from './bridge.types';

const BridgeDetailsInline: FC<BridgeDetailsInlineProps> = ({
  route,
  amount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const amountNum = Number.parseFloat(amount) || 0;
  const sourceName = CHAIN_REGISTRY[route.sourceChain].displayName;
  const destName = CHAIN_REGISTRY[route.destChain].displayName;

  if (amountNum <= 0) return null;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--details-bg)',
        border: '1px solid var(--details-border)',
      }}
    >
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer bg-transparent border-none text-xs text-text-muted"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="tabular-nums text-text-secondary">
          {sourceName} &#x2192; {destName}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center"
        >
          <ChevronDownSVG maxWidth="0.75rem" width="100%" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-3 flex flex-col gap-2.5"
              style={{ borderTop: '1px solid var(--details-divider)' }}
            >
              <div className="flex justify-between items-center pt-2.5">
                <span className="text-xs text-text-muted">Route</span>
                <span className="text-xs text-text">
                  {sourceName} &#x2192; {destName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Fee</span>
                <span className="text-xs text-text">--</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">Estimated Time</span>
                <span className="text-xs text-text">~10-15 seconds</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BridgeDetailsInline;
