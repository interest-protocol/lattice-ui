import type { FC } from 'react';

import { SOL_TYPE } from '@/constants/coins';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { Token } from '@/lib/entities';

const SwapDetails: FC = () => {
  const { getPrice } = useTokenPrices();

  const suiPrice = getPrice(Token.SUI.type);
  const solPrice = getPrice(SOL_TYPE);
  const hasRates =
    suiPrice != null && solPrice != null && suiPrice > 0 && solPrice > 0;
  const rate = hasRates ? (suiPrice / solPrice).toFixed(6) : '...';

  return (
    <div className="p-6 bg-surface-light rounded-2xl flex flex-col gap-4 border border-surface-border">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Exchange Rate</span>
        <span className="text-sm font-medium text-text">
          1 SUI &#x2248; {rate} SOL
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Slippage Tolerance</span>
        <span className="text-sm font-medium text-text">0.5%</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-muted">Estimated Time</span>
        <span className="text-sm font-medium text-text">~10-15 seconds</span>
      </div>
    </div>
  );
};

export default SwapDetails;
