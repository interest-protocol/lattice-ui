'use client';

import type { FC } from 'react';

import CopyButton from '@/components/ui/copy-button';
import { CHAIN_REGISTRY } from '@/constants/chains';
import { formatUnits } from '@/lib/bigint-utils';

interface NonceRequiredModalProps {
  solanaAddress: string;
  solBalance: bigint;
  requiredLamports: bigint;
  isCreating: boolean;
  createError: Error | null;
  onCreate: () => void;
  onRefreshBalance: () => void;
  refreshing: boolean;
}

const SOL_DECIMALS = CHAIN_REGISTRY.solana.decimals;

const NonceRequiredModal: FC<NonceRequiredModalProps> = ({
  solanaAddress,
  solBalance,
  requiredLamports,
  isCreating,
  createError,
  onCreate,
  onRefreshBalance,
  refreshing,
}) => {
  const hasEnoughSol = solBalance >= requiredLamports;
  const requiredDisplay = formatUnits(requiredLamports, SOL_DECIMALS);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full"
          style={{ background: 'var(--color-accent-wash)' }}
        >
          <svg
            aria-hidden="true"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm1.25-4.75c0 .69-.56 1.25-1.25 1.25s-1.25-.56-1.25-1.25v-4.5c0-.69.56-1.25 1.25-1.25s1.25.56 1.25 1.25v4.5z"
              fill="var(--color-accent)"
            />
          </svg>
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          XBridge requires a one-time{' '}
          <strong className="text-text">nonce account</strong> setup on Solana.
          {!hasEnoughSol && (
            <>
              {' '}
              You need at least{' '}
              <strong className="text-text">{requiredDisplay} SOL</strong> to
              cover the account rent. Send SOL to the address below.
            </>
          )}
        </p>
      </div>

      {!hasEnoughSol && (
        <div className="flex items-center gap-2 rounded-xl bg-surface-inset px-4 py-3">
          <span className="flex-1 font-mono text-xs break-all text-text-secondary">
            {solanaAddress}
          </span>
          <CopyButton
            text={solanaAddress}
            className="shrink-0 p-1 hover:text-accent text-text-muted"
            ariaLabel="Copy Solana address"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        {hasEnoughSol ? (
          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
            onClick={onCreate}
            disabled={isCreating}
          >
            {isCreating
              ? 'Creating...'
              : createError
                ? 'Retry — Create Nonce Account'
                : 'Create Nonce Account'}
          </button>
        ) : (
          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-white bg-accent hover:bg-accent-hover disabled:opacity-50 cursor-pointer border-none"
            onClick={onRefreshBalance}
            disabled={refreshing}
          >
            {refreshing ? 'Checking...' : 'Check Balance'}
          </button>
        )}
      </div>
    </div>
  );
};

export default NonceRequiredModal;
