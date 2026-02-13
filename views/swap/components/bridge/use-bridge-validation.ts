import { CHAIN_REGISTRY } from '@/constants/chains';
import { validateGasBalance } from '@/utils/gas-validation';

import type { BridgeRoute, ValidationResult } from './bridge.types';

interface UseBridgeValidationParams {
  route: BridgeRoute;
  amount: string;
  suiBalances: { sui: bigint; wsol: bigint };
  solanaBalances: { sol: bigint; wsui: bigint };
}

const useBridgeValidation = ({
  route,
  amount,
  suiBalances,
  solanaBalances,
}: UseBridgeValidationParams): ValidationResult => {
  if (!route.enabled) {
    return { isDisabled: true, message: 'Coming Soon' };
  }

  const amountNum = Number.parseFloat(amount) || 0;

  if (!amount || amountNum <= 0) {
    return { isDisabled: true, message: 'Enter amount' };
  }

  const sourceConfig = CHAIN_REGISTRY[route.sourceChain];
  const gasBalance =
    route.sourceChain === 'sui' ? suiBalances.sui : solanaBalances.sol;
  const isGasToken =
    route.sourceToken.symbol === sourceConfig.nativeToken.symbol;

  const gasError = validateGasBalance({
    gasBalance,
    gasDecimals: sourceConfig.decimals,
    minGas: sourceConfig.minGas,
    amount: amountNum,
    isGasToken,
    symbol: sourceConfig.nativeToken.symbol,
    displayDecimals: sourceConfig.displayPrecision,
  });
  if (gasError) return gasError;

  return { isDisabled: false, message: null };
};

export default useBridgeValidation;
