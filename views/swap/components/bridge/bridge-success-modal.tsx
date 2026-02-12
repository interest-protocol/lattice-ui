'use client';

import type { FC } from 'react';

import { CheckSVG, ExternalLinkSVG } from '@/components/ui/icons';
import { ExplorerMode, SolanaExplorerMode } from '@/constants';
import { CHAIN_REGISTRY } from '@/constants/chains';
import type { BridgeResult } from '@/hooks/domain/use-bridge';
import { useGetExplorerUrl } from '@/hooks/domain/use-get-explorer-url';
import { useGetSolanaExplorerUrl } from '@/hooks/domain/use-get-solana-explorer-url';
import { useModal } from '@/hooks/store/use-modal';
import { toSignificant } from '@/lib/bigint-utils';

interface BridgeSuccessModalProps {
  result: BridgeResult;
  onReset: () => void;
}

const BridgeSuccessModal: FC<BridgeSuccessModalProps> = ({
  result,
  onReset,
}) => {
  const handleClose = useModal((s) => s.handleClose);
  const getSuiExplorerUrl = useGetExplorerUrl();
  const getSolanaExplorerUrl = useGetSolanaExplorerUrl();

  const amountDisplay = toSignificant(result.amount, result.decimals, 6);

  const elapsedMs = Date.now() - result.startedAt;
  const totalSeconds = Math.round(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const elapsedDisplay =
    minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const sourceChainName = CHAIN_REGISTRY[result.sourceChainKey].displayName;
  const destChainName = CHAIN_REGISTRY[result.destChainKey].displayName;

  const depositTxUrl =
    result.sourceChainKey === 'solana'
      ? getSolanaExplorerUrl(
          result.depositDigest,
          SolanaExplorerMode.Transaction
        )
      : getSuiExplorerUrl(result.depositDigest, ExplorerMode.Transaction);

  const mintTxUrl =
    result.destChainKey === 'sui'
      ? getSuiExplorerUrl(result.mintDigest, ExplorerMode.Transaction)
      : getSolanaExplorerUrl(result.mintDigest, SolanaExplorerMode.Transaction);

  const truncateDigest = (digest: string) => {
    if (digest.length <= 16) return digest;
    return `${digest.slice(0, 8)}...${digest.slice(-6)}`;
  };

  const close = () => {
    handleClose();
    onReset();
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex justify-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-success)' }}
        >
          <CheckSVG maxWidth="1.25rem" maxHeight="1.25rem" fill="white" />
        </div>
      </div>

      <div
        className="flex flex-col gap-3 p-4 rounded-lg"
        style={{
          background: 'var(--color-surface-light)',
          border: '1px solid var(--color-surface-border)',
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Bridged</span>
          <span className="text-text font-semibold text-sm">
            {amountDisplay} {result.fromSymbol}
          </span>
        </div>

        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Received</span>
          <span className="text-text font-semibold text-sm">
            ~{amountDisplay} {result.toSymbol}
          </span>
        </div>

        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Time</span>
          <span className="text-text-muted text-sm">{elapsedDisplay}</span>
        </div>

        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">
            {sourceChainName} tx
          </span>
          <a
            href={depositTxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-accent text-sm font-mono hover:opacity-70 transition-opacity"
          >
            {truncateDigest(result.depositDigest)}
            <ExternalLinkSVG maxWidth="0.75rem" maxHeight="0.75rem" />
          </a>
        </div>

        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">
            {destChainName} tx
          </span>
          <a
            href={mintTxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-accent text-sm font-mono hover:opacity-70 transition-opacity"
          >
            {truncateDigest(result.mintDigest)}
            <ExternalLinkSVG maxWidth="0.75rem" maxHeight="0.75rem" />
          </a>
        </div>
      </div>

      <button
        type="button"
        className="w-full p-4 text-white rounded-xl font-semibold text-base text-center border-none transition-colors duration-200 focus-ring"
        style={{
          cursor: 'pointer',
          background: 'var(--btn-primary-bg)',
          boxShadow: 'var(--btn-primary-shadow)',
        }}
        onClick={close}
      >
        Close
      </button>
    </div>
  );
};

export default BridgeSuccessModal;
