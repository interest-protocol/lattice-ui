import { Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { SOL_TYPE } from '@/constants/coins';
import useTokenPrices from '@/hooks/blockchain/use-token-prices';
import { Token } from '@/lib/entities';

const SwapDetails: FC = () => {
  const { getPrice } = useTokenPrices();

  const suiPrice = getPrice(Token.SUI.type);
  const solPrice = getPrice(SOL_TYPE);
  const hasRates = suiPrice > 0 && solPrice > 0;
  const rate = hasRates ? (suiPrice / solPrice).toFixed(6) : '...';

  return (
    <Div
      p="1.5rem"
      bg="#FFFFFF0D"
      borderRadius="1rem"
      display="flex"
      flexDirection="column"
      gap="1rem"
    >
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Exchange Rate
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          1 SUI ≈ {rate} SOL
        </Span>
      </Div>
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Slippage Tolerance
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          0.5%
        </Span>
      </Div>
      <Div display="flex" justifyContent="space-between" alignItems="center">
        <Span fontSize="0.875rem" color="#FFFFFF80">
          Estimated Time
        </Span>
        <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
          ~2-5 minutes
        </Span>
      </Div>
    </Div>
  );
};

export default SwapDetails;
