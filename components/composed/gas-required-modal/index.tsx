'use client';

import { type FC, useState } from 'react';

import { CopySVG, WalletSVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';

interface GasRequiredModalProps {
  suiAddress: string;
  onRetry: () => Promise<void>;
}

const GasRequiredModal: FC<GasRequiredModalProps> = ({
  suiAddress,
  onRetry,
}) => {
  const [retrying, setRetrying] = useState(false);

  const copyAddress = () => {
    window.navigator.clipboard.writeText(suiAddress);
    toasting.success({ action: 'Copy', message: 'Address copied' });
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 text-text-muted">
        <WalletSVG width="100%" maxWidth="1.25rem" maxHeight="1.25rem" />
        <p className="text-sm leading-relaxed">
          A one-time gas fee is needed to link your wallets on-chain. Send at
          least <strong className="text-text">0.01 SUI</strong> to the address
          below.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-3">
        <span className="flex-1 font-mono text-xs break-all text-text-secondary">
          {suiAddress}
        </span>
        <button
          type="button"
          className="shrink-0 cursor-pointer bg-transparent border-none p-1 hover:text-accent text-text-muted"
          onClick={copyAddress}
          aria-label="Copy Sui address"
        >
          <CopySVG width="100%" maxWidth="1rem" maxHeight="1rem" />
        </button>
      </div>
      <button
        type="button"
        className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
        onClick={handleRetry}
        disabled={retrying}
      >
        {retrying ? 'Retrying...' : 'Retry Wallet Setup'}
      </button>
    </div>
  );
};

export default GasRequiredModal;
