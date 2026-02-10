import { Button } from '@stylin.js/elements';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { CHAIN_REGISTRY } from '@/constants/chains';
import { ACCENT, ACCENT_HOVER } from '@/constants/colors';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { CurrencyAmount, Token } from '@/lib/entities';
import { validateSwapAmount } from '@/utils/gas-validation';

const SwapFormButton: FC = () => {
  const { control } = useFormContext();
  const fromValue = useWatch({ control, name: 'from.value' }) as string;
  const fromType = useWatch({ control, name: 'from.type' }) as string;
  const toType = useWatch({ control, name: 'to.type' }) as string;

  const { suiAddress, solanaAddress } = useWalletAddresses();

  const { amounts: suiAmounts } = useSuiBalances(suiAddress);
  const { amounts: solanaAmounts } = useSolanaBalances(solanaAddress);

  const sourceToken = Token.fromType(fromType);
  const destToken = Token.fromType(toType);
  const sourceConfig = CHAIN_REGISTRY[sourceToken.chainId];
  const destConfig = CHAIN_REGISTRY[destToken.chainId];

  const validation = useMemo(() => {
    const amount = CurrencyAmount.fromHumanAmount(
      sourceToken,
      fromValue || '0'
    );
    const gasBalance = sourceToken.isSui() ? suiAmounts.sui : solanaAmounts.sol;
    return validateSwapAmount(amount, gasBalance);
  }, [fromValue, sourceToken, suiAmounts.sui, solanaAmounts.sol]);

  const handleSwap = () => {
    // Swap execution handled by parent form submission
  };

  const buttonLabel = validation.message
    ? validation.message
    : `Swap ${sourceConfig.nativeToken.symbol} to ${destConfig.nativeToken.symbol}`;

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
