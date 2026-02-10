import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Button } from '@stylin.js/elements';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { ACCENT, ACCENT_HOVER } from '@/constants/colors';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { validateSwapInput } from '@/utils/gas-validation';

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
    const isSui = fromType === SUI_TYPE_ARG;
    return validateSwapInput({
      amount: fromValue,
      token: isSui ? 'SUI' : 'SOL',
      gasBalance: isSui ? suiBalances.sui : solanaBalances.sol,
    });
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
