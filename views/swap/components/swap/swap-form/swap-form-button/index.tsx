import { Button } from '@stylin.js/elements';
import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { CHAIN_REGISTRY, chainKeyFromTokenType } from '@/constants/chains';
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

  const { suiAddress, solanaAddress } = useWalletAddresses();

  const { balances: suiBalances } = useSuiBalances(suiAddress);
  const { balances: solanaBalances } = useSolanaBalances(solanaAddress);

  const sourceChain = chainKeyFromTokenType(fromType);
  const destChain = chainKeyFromTokenType(toType);
  const sourceConfig = CHAIN_REGISTRY[sourceChain];
  const destConfig = CHAIN_REGISTRY[destChain];

  const validation = useMemo(() => {
    const token = sourceConfig.nativeToken.symbol as 'SUI' | 'SOL';
    return validateSwapInput({
      amount: fromValue,
      token,
      gasBalance: sourceChain === 'sui' ? suiBalances.sui : solanaBalances.sol,
    });
  }, [
    fromValue,
    sourceChain,
    sourceConfig.nativeToken.symbol,
    suiBalances.sui,
    solanaBalances.sol,
  ]);

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
