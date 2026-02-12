import { type FC, useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import Spinner from '@/components/ui/spinner';
import { CHAIN_REGISTRY } from '@/constants/chains';
import useBalances from '@/hooks/domain/use-balances';
import type { SwapStatus } from '@/hooks/domain/use-swap';
import useSwap from '@/hooks/domain/use-swap';
import { useModal } from '@/hooks/store/use-modal';
import { CurrencyAmount, Token } from '@/lib/entities';
import { validateSwapAmount } from '@/utils/gas-validation';
import SwapSuccessModal from '../swap-success-modal';

const STATUS_LABELS: Record<SwapStatus, string> = {
  idle: '',
  depositing: 'Depositing...',
  verifying: 'Verifying...',
  creating: 'Creating request...',
  waiting: 'Waiting for solver...',
  success: '',
  error: '',
};

const SwapFormButton: FC = () => {
  const { control } = useFormContext();
  const fromValue = useWatch({ control, name: 'from.value' }) as string;
  const fromType = useWatch({ control, name: 'from.type' }) as string;
  const fromValueBN = useWatch({ control, name: 'from.valueBN' }) as bigint;
  const toType = useWatch({ control, name: 'to.type' }) as string;

  const { suiAmounts, solanaAmounts } = useBalances();
  const { swap, isLoading, status, result, reset } = useSwap();
  const setContent = useModal((s) => s.setContent);
  const shownResultRef = useRef<typeof result>(null);

  useEffect(() => {
    if (status === 'success' && result && shownResultRef.current !== result) {
      shownResultRef.current = result;
      setContent(<SwapSuccessModal result={result} onReset={reset} />, {
        title: 'Swap Complete',
      });
    }
  }, [status, result, setContent, reset]);

  const sourceToken = Token.fromType(fromType);
  const destToken = Token.fromType(toType);
  const sourceConfig = CHAIN_REGISTRY[sourceToken.chainId];
  const destConfig = CHAIN_REGISTRY[destToken.chainId];

  const amount = CurrencyAmount.fromHumanAmount(sourceToken, fromValue || '0');
  const gasBalance = sourceToken.isSui() ? suiAmounts.sui : solanaAmounts.sol;
  const validation = validateSwapAmount(amount, gasBalance);

  const handleSwap = () => {
    swap({ fromType, toType, fromAmount: fromValueBN });
  };

  const isDisabled = validation.isDisabled || isLoading;

  const buttonLabel = isLoading
    ? STATUS_LABELS[status]
    : validation.message
      ? validation.message
      : `Swap ${sourceConfig.nativeToken.symbol} to ${destConfig.nativeToken.symbol}`;

  return (
    <button
      type="button"
      className="w-full py-4 px-6 text-white text-base font-semibold rounded-xl border-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-ring"
      style={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        background: 'var(--btn-primary-bg)',
        boxShadow: 'var(--btn-primary-shadow)',
      }}
      onClick={handleSwap}
      disabled={isDisabled}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && <Spinner />}
        {buttonLabel}
      </span>
    </button>
  );
};

export default SwapFormButton;
