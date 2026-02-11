'use client';

import type { FC } from 'react';

import CopyButton from '@/components/ui/copy-button';
import { WalletSVG } from '@/components/ui/icons';
import type { ChainKey } from '@/constants/chains';
import { CHAIN_REGISTRY } from '@/constants/chains';

interface GasRequiredModalProps {
  chain: ChainKey;
  address: string;
  minAmount: number;
  onRefresh: () => void;
  refreshing: boolean;
  action?: {
    label: string;
    onClick: () => void;
    loading: boolean;
  };
}

const GasRequiredModal: FC<GasRequiredModalProps> = ({
  chain,
  address,
  minAmount,
  onRefresh,
  refreshing,
  action,
}) => {
  const config = CHAIN_REGISTRY[chain];
  const symbol = config.nativeToken.symbol;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 text-text-muted">
        <WalletSVG width="100%" maxWidth="1.25rem" maxHeight="1.25rem" />
        <p className="text-sm leading-relaxed">
          You need <strong className="text-text">{symbol}</strong> to pay for
          transaction fees on {config.displayName}. Send at least{' '}
          <strong className="text-text">
            {minAmount} {symbol}
          </strong>{' '}
          to the address below.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-3">
        <span className="flex-1 font-mono text-xs break-all text-text-secondary">
          {address}
        </span>
        <CopyButton
          text={address}
          className="shrink-0 p-1 hover:text-accent text-text-muted"
          ariaLabel={`Copy ${config.displayName} address`}
        />
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Checking...' : 'Check Balance'}
        </button>
        {action && (
          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-text-secondary bg-surface-light hover:bg-surface-hover disabled:opacity-50 cursor-pointer border-none"
            onClick={action.onClick}
            disabled={action.loading}
          >
            {action.loading ? 'Retrying...' : action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default GasRequiredModal;
