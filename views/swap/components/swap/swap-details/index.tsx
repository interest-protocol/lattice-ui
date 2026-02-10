import { Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

const SwapDetails: FC = () => (
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
        1 SUI = ~ 0.00 SOL
      </Span>
    </Div>
    <Div display="flex" justifyContent="space-between" alignItems="center">
      <Span fontSize="0.875rem" color="#FFFFFF80">
        Bridge Fee
      </Span>
      <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
        ~0.00 SUI
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

export default SwapDetails;
