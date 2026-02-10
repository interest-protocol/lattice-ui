import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Button } from '@stylin.js/elements';
import BigNumber from 'bignumber.js';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import {
  ALPHA_MAX_SOL,
  ALPHA_MAX_SUI,
  MIN_GAS_SOL,
  MIN_GAS_SUI,
} from '@/constants/alpha-limits';
import { SOL_DECIMALS, SOL_TYPE } from '@/constants/coins';
import { ACCENT, ACCENT_HOVER } from '@/constants/colors';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSuiBalances from '@/hooks/use-sui-balances';
import useWalletAddresses from '@/hooks/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';

const SUI_DECIMALS = 9;

const SwapFormButton: FC = () => {
  const { control } = useFormContext();
  const fromValue = useWatch({ control, name: 'from.value' }) as string;
  const fromType = useWatch({ control, name: 'from.type' }) as string;
  const toType = useWatch({ control, name: 'to.type' }) as string;

  // Get wallet addresses from centralized hook
  const { suiAddress, solanaAddress } = useWalletAddresses();

  // Get balances
  const { balances: suiBalances } = useSuiBalances(suiAddress);
  const { balances: solanaBalances } = useSolanaBalances(solanaAddress);

  // Validation
  const validation = useMemo(() => {
    const amount = Number.parseFloat(fromValue) || 0;
    const isSui = fromType === SUI_TYPE_ARG;
    const isSol = fromType === SOL_TYPE;

    // No amount entered
    if (!fromValue || amount <= 0) {
      return { isDisabled: true, message: 'Enter amount' };
    }

    // Check alpha limits
    if (isSui && amount > ALPHA_MAX_SUI) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SUI} SUI (alpha limit)`,
      };
    }
    if (isSol && amount > ALPHA_MAX_SOL) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SOL} SOL (alpha limit)`,
      };
    }

    // Check gas balance
    if (isSui) {
      const gasNeeded = new BigNumber(MIN_GAS_SUI).times(10 ** SUI_DECIMALS);
      const amountRaw = new BigNumber(amount).times(10 ** SUI_DECIMALS);
      const totalNeeded = gasNeeded.plus(amountRaw);

      if (suiBalances.sui.lt(totalNeeded)) {
        const suiBalance = FixedPointMath.toNumber(
          suiBalances.sui,
          SUI_DECIMALS
        );
        return {
          isDisabled: true,
          message: `Insufficient SUI (need ${amount} + ~${MIN_GAS_SUI} gas, have ${suiBalance.toFixed(4)})`,
        };
      }
    }

    if (isSol) {
      const gasNeeded = new BigNumber(MIN_GAS_SOL).times(10 ** SOL_DECIMALS);
      const amountRaw = new BigNumber(amount).times(10 ** SOL_DECIMALS);
      const totalNeeded = gasNeeded.plus(amountRaw);

      if (solanaBalances.sol.lt(totalNeeded)) {
        const solBalance = FixedPointMath.toNumber(
          solanaBalances.sol,
          SOL_DECIMALS
        );
        return {
          isDisabled: true,
          message: `Insufficient SOL (need ${amount} + ~${MIN_GAS_SOL} gas, have ${solBalance.toFixed(6)})`,
        };
      }
    }

    return { isDisabled: false, message: null };
  }, [fromValue, fromType, suiBalances.sui, solanaBalances.sol]);

  const handleSwap = () => {
    // Swap execution handled by parent form submission
  };

  const buttonLabel = validation.message
    ? validation.message
    : `Swap ${fromType === SUI_TYPE_ARG ? 'SUI' : 'SOL'} to ${toType === SUI_TYPE_ARG ? 'SUI' : 'SOL'}`;

  return (
    <Button
      width="100%"
      py="1rem"
      px="1.5rem"
      bg={ACCENT}
      color="white"
      fontSize="1rem"
      fontWeight="600"
      borderRadius="0.75rem"
      border="none"
      cursor={validation.isDisabled ? 'not-allowed' : 'pointer'}
      opacity={validation.isDisabled ? 0.5 : 1}
      nHover={!validation.isDisabled ? { bg: ACCENT_HOVER } : {}}
      onClick={handleSwap}
      disabled={validation.isDisabled}
    >
      {buttonLabel}
    </Button>
  );
};

export default SwapFormButton;
