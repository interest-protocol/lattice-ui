import { Div, P, Span } from '@stylin.js/elements';
import { type FC, useState } from 'react';

import Tabs from '@/components/ui/tabs';
import { ALPHA_MAX_SOL, ALPHA_MAX_SUI } from '@/constants/alpha-limits';

import { Bridge, Swap } from './components';

const TABS = ['Swap', 'Bridge'] as const;

const SwapContent: FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <Div
      flex="1"
      mx="auto"
      gap="1rem"
      display="flex"
      borderRadius="1rem"
      flexDirection="column"
      px={['0.5rem', '2rem']}
      width={['100%', '34rem']}
      my={['1rem', '1rem', '1rem', '1rem', '3rem']}
    >
      {/* Closed Alpha Banner */}
      <Div
        p="1rem"
        bg="#F59E0B1A"
        border="1px solid #F59E0B4D"
        borderRadius="0.75rem"
        display="flex"
        flexDirection="column"
        gap="0.5rem"
      >
        <Div display="flex" alignItems="center" gap="0.5rem">
          <Span fontSize="1rem">⚠️</Span>
          <Span color="#F59E0B" fontWeight="600" fontSize="0.875rem">
            Closed Alpha
          </Span>
        </Div>
        <P color="#FFFFFF99" fontSize="0.8rem" lineHeight="1.4" m="0">
          This is an early alpha version with limited liquidity. Transactions
          are capped at{' '}
          <Span color="#FFFFFF" fontWeight="600">
            {ALPHA_MAX_SUI} SUI
          </Span>{' '}
          and{' '}
          <Span color="#FFFFFF" fontWeight="600">
            {ALPHA_MAX_SOL} SOL
          </Span>
          . You must have enough native tokens to cover gas fees.
        </P>
      </Div>

      <Tabs tab={tab} setTab={setTab} tabs={TABS} />
      {tab === 0 && <Swap />}
      {tab === 1 && <Bridge />}
    </Div>
  );
};
export default SwapContent;
