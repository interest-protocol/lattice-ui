import { type FC, useState } from 'react';

import Tabs, { TabPanel } from '@/components/ui/tabs';
import { CHAIN_REGISTRY } from '@/constants/chains';

import { Bridge, Swap } from './components';

const TABS = ['Swap', 'Bridge'] as const;

const WarningSVG = () => (
  <svg
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    className="flex-shrink-0"
  >
    <path
      d="M8 1.333L14.667 13H1.333L8 1.333z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M8 6v3M8 11h.007"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SwapContent: FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex-1 mx-auto gap-4 flex rounded-2xl flex-col px-2 sm:px-8 w-full sm:w-[34rem] my-4 xl:my-12">
      {/* Closed Alpha Banner */}
      <div className="p-3 bg-warning-bg border border-warning-border rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-warning">
            <WarningSVG />
          </span>
          <span className="text-warning font-semibold text-sm">
            Closed Alpha
          </span>
        </div>
        <p className="text-text-secondary text-xs leading-relaxed m-0">
          This is an early alpha version with limited liquidity. Transactions
          are capped at{' '}
          <span className="text-text font-semibold">
            {CHAIN_REGISTRY.sui.alphaMax} SUI
          </span>{' '}
          and{' '}
          <span className="text-text font-semibold">
            {CHAIN_REGISTRY.solana.alphaMax} SOL
          </span>
          . You must have enough native tokens to cover gas fees.
        </p>
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={TABS} id="swap" />
      <TabPanel index={0} active={tab === 0} id="swap">
        <Swap />
      </TabPanel>
      <TabPanel index={1} active={tab === 1} id="swap">
        <Bridge />
      </TabPanel>
    </div>
  );
};
export default SwapContent;
