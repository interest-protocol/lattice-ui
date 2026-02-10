import type { FC } from 'react';
import { useMemo } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { CHAIN_REGISTRY } from '@/constants/chains';
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
    <button
      type="button"
      className="w-full py-4 px-6 bg-accent text-white text-base font-semibold rounded-xl border-none hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        cursor: validation.isDisabled ? 'not-allowed' : 'pointer',
        opacity: validation.isDisabled ? 0.5 : 1,
      }}
      onClick={handleSwap}
      disabled={validation.isDisabled}
    >
      {buttonLabel}
    </button>
  );
};

export default SwapFormButton;
