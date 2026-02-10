import { Button } from '@stylin.js/elements';
import type { FC } from 'react';

import { ACCENT, ACCENT_HOVER } from '@/constants/colors';
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
  <Button
    all="unset"
    width="100%"
    py="1rem"
    px="1.5rem"
    bg={ACCENT}
    color="white"
    fontSize="1rem"
    fontWeight="600"
    borderRadius="0.75rem"
    border="none"
    textAlign="center"
    cursor={isDisabled ? 'not-allowed' : 'pointer'}
    opacity={isDisabled ? 0.5 : 1}
    nHover={!isDisabled ? { bg: ACCENT_HOVER } : {}}
    onClick={onBridge}
    disabled={isDisabled}
  >
    {isLoading
      ? STATUS_LABELS[status]
      : validationMessage
        ? validationMessage
        : `Bridge ${token.symbol} to ${destNetwork}`}
  </Button>
);

export default BridgeButton;
