import { AnimatePresence, motion } from 'motion/react';
import { type FC, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { ChevronDownSVG } from '@/components/ui/icons';
import { DEFAULT_SLIPPAGE_BPS, SLIPPAGE_STORAGE_KEY } from '@/constants';
import { SOL_TYPE } from '@/constants/coins';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { Percent, Token } from '@/lib/entities';

const SwapDetails: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getPrice } = useTokenPrices();
  const [slippageBps] = useLocalStorage(
    SLIPPAGE_STORAGE_KEY,
    DEFAULT_SLIPPAGE_BPS
  );

  const suiPrice = getPrice(Token.SUI.type);
  const solPrice = getPrice(SOL_TYPE);
  const hasRates =
    suiPrice != null && solPrice != null && suiPrice > 0 && solPrice > 0;
  const rate = hasRates ? (suiPrice / solPrice).toFixed(6) : '...';

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
          1 SUI &#x2248; {rate} SOL
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
                <span className="text-xs text-text-muted">Exchange Rate</span>
                <span className="text-xs text-text tabular-nums">
                  1 SUI &#x2248; {rate} SOL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-text-muted">
                  Slippage Tolerance
                </span>
                <span className="text-xs text-text tabular-nums">
                  {Percent.fromBps(slippageBps).toPercent(1)}
                </span>
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

export default SwapDetails;
