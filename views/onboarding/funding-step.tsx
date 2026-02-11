'use client';

import { type FC, useEffect, useRef } from 'react';

import CopyButton from '@/components/ui/copy-button';
import Spinner from '@/components/ui/spinner';
import { WalletSVG } from '@/components/ui/icons';
import { CHAIN_REGISTRY } from '@/constants/chains';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { formatUnits, parseUnits } from '@/lib/bigint-utils';

const MIN_GAS = CHAIN_REGISTRY.sui.minGas;
const MIN_GAS_RAW = parseUnits(String(MIN_GAS), CHAIN_REGISTRY.sui.decimals);
const SUI_DECIMALS = CHAIN_REGISTRY.sui.decimals;

const FundingStep: FC = () => {
  const suiAddress = useOnboarding((s) => s.suiAddress);
  const startLinking = useOnboarding((s) => s.startLinking);
  const hasAdvanced = useRef(false);

  const { balances, isLoading, mutate } = useSuiBalances(suiAddress);
  const suiBalance = balances.sui;
  const hasSufficientBalance = suiBalance >= MIN_GAS_RAW;

  // Auto-advance when balance is sufficient
  useEffect(() => {
    if (hasSufficientBalance && !hasAdvanced.current) {
      hasAdvanced.current = true;
      startLinking();
    }
  }, [hasSufficientBalance, startLinking]);

  const handleCheckBalance = async () => {
    const result = await mutate();
    if (result.sui >= MIN_GAS_RAW && !hasAdvanced.current) {
      hasAdvanced.current = true;
      startLinking();
    }
  };

  if (!suiAddress) return null;

  const displayBalance = formatUnits(suiBalance, SUI_DECIMALS);

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
      <div className="flex items-center justify-between rounded-xl bg-surface-inset px-4 py-3">
        <span className="text-sm text-text-muted">Current balance</span>
        <span className="text-sm font-semibold text-text">
          {isLoading ? (
            <Spinner size="0.875rem" className="text-accent" />
          ) : (
            `${displayBalance} SUI`
          )}
        </span>
      </div>
      <button
        type="button"
        className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
        onClick={handleCheckBalance}
        disabled={isLoading}
      >
        {isLoading ? 'Checking...' : 'Check Balance'}
      </button>
    </div>
  );
};

export default FundingStep;
