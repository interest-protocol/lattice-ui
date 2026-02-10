import type { FC } from 'react';

import type { BridgeStatus } from '@/hooks/domain/use-bridge';

import type { BridgeButtonProps } from './bridge.types';

const STATUS_LABELS: Record<BridgeStatus, string> = {
  idle: '',
  depositing: 'Depositing...',
  creating: 'Creating request...',
  voting: 'Verifying...',
  executing: 'Executing...',
  waiting: 'Confirming...',
  success: 'Bridge completed!',
  error: 'Bridge failed',
};

const BridgeButton: FC<BridgeButtonProps> = ({
  isDisabled,
  isLoading,
  status,
  validationMessage,
  token,
  destNetwork,
  onBridge,
}) => (
  <button
    type="button"
    className="w-full py-4 px-6 bg-accent text-white text-base font-semibold rounded-xl border-none hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
    style={{
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
    }}
    onClick={onBridge}
    disabled={isDisabled}
  >
    {isLoading
      ? STATUS_LABELS[status]
      : validationMessage
        ? validationMessage
        : `Bridge ${token.symbol} to ${destNetwork}`}
  </button>
);

export default BridgeButton;
