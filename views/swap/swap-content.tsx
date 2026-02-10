import { type FC, useState } from 'react';

import Tabs from '@/components/ui/tabs';
import { CHAIN_REGISTRY } from '@/constants/chains';

import { Bridge, Swap } from './components';

const TABS = ['Swap', 'Bridge'] as const;

const SwapContent: FC = () => {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex-1 mx-auto gap-4 flex rounded-2xl flex-col px-2 sm:px-8 w-full sm:w-[34rem] my-4 xl:my-12">
      {/* Closed Alpha Banner */}
      <div className="p-4 bg-[#F59E0B1A] border border-[#F59E0B4D] rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-base">&#x26A0;&#xFE0F;</span>
          <span className="text-[#F59E0B] font-semibold text-sm">
            Closed Alpha
          </span>
        </div>
        <p className="text-[#FFFFFF99] text-[0.8rem] leading-relaxed m-0">
          This is an early alpha version with limited liquidity. Transactions
          are capped at{' '}
          <span className="text-white font-semibold">
            {CHAIN_REGISTRY.sui.alphaMax} SUI
          </span>{' '}
          and{' '}
          <span className="text-white font-semibold">
            {CHAIN_REGISTRY.solana.alphaMax} SOL
          </span>
          . You must have enough native tokens to cover gas fees.
        </p>
      </div>

      <Tabs tab={tab} setTab={setTab} tabs={TABS} />
      {tab === 0 && <Swap />}
      {tab === 1 && <Bridge />}
    </div>
  );
};
export default SwapContent;
