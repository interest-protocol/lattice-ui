import BigNumber from 'bignumber.js';

import {
  ALPHA_MAX_SOL,
  ALPHA_MAX_SUI,
  MIN_GAS_SOL,
  MIN_GAS_SUI,
} from '@/constants/alpha-limits';
import { SOL_DECIMALS, SUI_DECIMALS } from '@/constants/coins';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';

interface ValidationResult {
  isDisabled: true;
  message: string;
}

const ALPHA_LIMITS: Record<string, { max: number; symbol: string }> = {
  SUI: { max: ALPHA_MAX_SUI, symbol: 'SUI' },
  SOL: { max: ALPHA_MAX_SOL, symbol: 'SOL' },
};

export const validateAlphaLimit = (
  token: 'SUI' | 'SOL',
  amount: number
): ValidationResult | null => {
  const limit = ALPHA_LIMITS[token];
  if (amount > limit.max) {
    return {
      isDisabled: true,
      message: `Max ${limit.max} ${limit.symbol} (alpha limit)`,
    };
  }
  return null;
};

interface GasValidationParams {
  gasBalance: BigNumber;
  gasDecimals: number;
  minGas: number;
  amount: number;
  isGasToken: boolean;
  symbol: string;
  displayDecimals: number;
}

export const validateGasBalance = ({
  gasBalance,
  gasDecimals,
  minGas,
  amount,
  isGasToken,
  symbol,
  displayDecimals,
}: GasValidationParams): ValidationResult | null => {
  const gasNeeded = new BigNumber(minGas).times(10 ** gasDecimals);
  const amountRaw = isGasToken
    ? new BigNumber(amount).times(10 ** gasDecimals)
    : new BigNumber(0);
  const totalNeeded = gasNeeded.plus(amountRaw);

  if (gasBalance.lt(totalNeeded)) {
    const balanceDisplay = FixedPointMath.toNumber(gasBalance, gasDecimals);
    if (isGasToken) {
      return {
        isDisabled: true,
        message: `Insufficient ${symbol} (need ${amount} + ~${minGas} gas, have ${balanceDisplay.toFixed(displayDecimals)})`,
      };
    }
    return {
      isDisabled: true,
      message: `Insufficient ${symbol} for gas (need ~${minGas}, have ${balanceDisplay.toFixed(displayDecimals)})`,
    };
  }
  return null;
};

interface SwapInputParams {
  amount: string;
  token: 'SUI' | 'SOL';
  gasBalance: BigNumber;
  isGasToken?: boolean;
}

interface SwapValidationResult {
  isDisabled: boolean;
  message: string | null;
}

export const validateSwapInput = ({
  amount,
  token,
  gasBalance,
  isGasToken = true,
}: SwapInputParams): SwapValidationResult => {
  const amountNum = Number.parseFloat(amount) || 0;

  if (!amount || amountNum <= 0) {
    return { isDisabled: true, message: 'Enter amount' };
  }

  const alphaError = validateAlphaLimit(token, amountNum);
  if (alphaError) return alphaError;

  const isSui = token === 'SUI';
  const gasError = validateGasBalance({
    gasBalance,
    gasDecimals: isSui ? SUI_DECIMALS : SOL_DECIMALS,
    minGas: isSui ? MIN_GAS_SUI : MIN_GAS_SOL,
    amount: amountNum,
    isGasToken,
    symbol: token,
    displayDecimals: isSui ? 4 : 6,
  });
  if (gasError) return gasError;

  return { isDisabled: false, message: null };
};
