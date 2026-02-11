'use client';

import { type FC, useState } from 'react';

import CopyButton from '@/components/ui/copy-button';
import { WalletSVG } from '@/components/ui/icons';
import { CHAIN_REGISTRY } from '@/constants/chains';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { parseUnits } from '@/lib/bigint-utils';

const MIN_GAS = CHAIN_REGISTRY.sui.minGas;
const MIN_GAS_RAW = parseUnits(String(MIN_GAS), CHAIN_REGISTRY.sui.decimals);

const FundingStep: FC = () => {
  const suiAddress = useOnboarding((s) => s.suiAddress);
  const retryLink = useOnboarding((s) => s.retryLink);
  const [checking, setChecking] = useState(false);

  const { mutate } = useSuiBalances(suiAddress);

  const handleCheckBalance = async () => {
    setChecking(true);
    try {
      const result = await mutate();
      if (result.sui >= MIN_GAS_RAW) {
        retryLink?.();
      }
    } finally {
      setChecking(false);
    }
  };

  if (!suiAddress) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 text-text-muted">
        <WalletSVG width="100%" maxWidth="1.25rem" maxHeight="1.25rem" />
        <p className="text-sm leading-relaxed">
          Send at least <strong className="text-text">{MIN_GAS} SUI</strong> to
          your wallet to cover transaction fees.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-3">
        <span className="flex-1 font-mono text-xs break-all text-text-secondary">
          {suiAddress}
        </span>
        <CopyButton
          text={suiAddress}
          className="shrink-0 p-1 hover:text-accent text-text-muted"
          ariaLabel="Copy SUI address"
        />
      </div>
      <button
        type="button"
        className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
        onClick={handleCheckBalance}
        disabled={checking}
      >
        {checking ? 'Checking...' : 'Check Balance'}
      </button>
    </div>
  );
};

export default FundingStep;
