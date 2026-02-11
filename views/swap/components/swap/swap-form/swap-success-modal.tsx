'use client';

import type { FC } from 'react';

import { CheckSVG, ExternalLinkSVG } from '@/components/ui/icons';
import { ExplorerMode, SolanaExplorerMode } from '@/constants';
import { CHAIN_REGISTRY } from '@/constants/chains';
import { useGetExplorerUrl } from '@/hooks/domain/use-get-explorer-url';
import { useGetSolanaExplorerUrl } from '@/hooks/domain/use-get-solana-explorer-url';
import type { SwapResult } from '@/hooks/domain/use-swap';
import { useModal } from '@/hooks/store/use-modal';
import { toSignificant } from '@/lib/bigint-utils';
import { Token } from '@/lib/entities';

interface SwapSuccessModalProps {
  result: SwapResult;
  onReset: () => void;
}

const SwapSuccessModal: FC<SwapSuccessModalProps> = ({ result, onReset }) => {
  const handleClose = useModal((s) => s.handleClose);
  const getSuiExplorerUrl = useGetExplorerUrl();
  const getSolanaExplorerUrl = useGetSolanaExplorerUrl();

  const fromToken = Token.fromType(result.fromType);
  const toToken = Token.fromType(result.toType);

  const fromDisplay = toSignificant(result.fromAmount, fromToken.decimals, 6);
  const toDisplay = toSignificant(result.toAmount, toToken.decimals, 6);
  const feeDisplay = toSignificant(result.feeAmount, toToken.decimals, 4);

  const getSourceTxUrl = () => {
    if (result.sourceChainKey === 'sui') {
      return getSuiExplorerUrl(result.depositDigest, ExplorerMode.Transaction);
    }
    return getSolanaExplorerUrl(
      result.depositDigest,
      SolanaExplorerMode.Transaction
    );
  };

  const getDestTxUrl = () => {
    if (!result.destinationTxDigest) return null;
    if (result.destChainKey === 'sui') {
      return getSuiExplorerUrl(
        result.destinationTxDigest,
        ExplorerMode.Transaction
      );
    }
    return getSolanaExplorerUrl(
      result.destinationTxDigest,
      SolanaExplorerMode.Transaction
    );
  };

  const sourceTxUrl = getSourceTxUrl();
  const destTxUrl = getDestTxUrl();

  const sourceChainName = CHAIN_REGISTRY[result.sourceChainKey].displayName;
  const destChainName = CHAIN_REGISTRY[result.destChainKey].displayName;

  const totalSeconds = Math.round(result.elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const elapsedDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const close = () => {
    handleClose();
    onReset();
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--color-success)' }}
        >
          <CheckSVG maxWidth="1.25rem" maxHeight="1.25rem" fill="white" />
        </div>
      </div>

      {/* Swap Details */}
      <div
        className="flex flex-col gap-3 p-4 rounded-lg"
        style={{
          background: 'var(--color-surface-light)',
          border: '1px solid var(--color-surface-border)',
        }}
      >
        {/* Sent */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">
            Sent on {sourceChainName}
          </span>
          <span className="text-text font-semibold text-sm">
            {fromDisplay} {fromToken.symbol}
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        {/* Received */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">
            Received on {destChainName}
          </span>
          <span className="text-text font-semibold text-sm">
            ~{toDisplay} {toToken.symbol}
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        {/* Fee */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Slippage fee</span>
          <span className="text-text-muted text-sm">
            {feeDisplay} {toToken.symbol}
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        {/* Time */}
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">Time</span>
          <span className="text-text-muted text-sm">{elapsedDisplay}</span>
        </div>

        {/* Divider */}
        <div
          className="h-px w-full"
          style={{ background: 'var(--color-surface-border)' }}
        />

        {/* Explorer Links */}
        <div className="flex items-center gap-3">
          <a
            href={sourceTxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-accent text-xs px-3 py-1.5 rounded-full hover:opacity-70 transition-opacity"
            style={{
              border: '1px solid var(--color-accent-border)',
              background: 'var(--color-accent-wash)',
            }}
          >
            Deposit tx
            <ExternalLinkSVG maxWidth="0.875rem" maxHeight="0.875rem" />
          </a>
          {destTxUrl && (
            <a
              href={destTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-accent text-xs px-3 py-1.5 rounded-full hover:opacity-70 transition-opacity"
              style={{
                border: '1px solid var(--color-accent-border)',
                background: 'var(--color-accent-wash)',
              }}
            >
              Receive tx
              <ExternalLinkSVG maxWidth="0.875rem" maxHeight="0.875rem" />
            </a>
          )}
        </div>
      </div>

      {/* Close Button */}
      <button
        type="button"
        className="w-full p-4 text-white rounded-xl font-semibold text-base text-center border-none transition-all duration-200"
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

export default SwapSuccessModal;
