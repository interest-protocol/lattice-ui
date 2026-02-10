import BigNumber from 'bignumber.js';

import { CHAIN_REGISTRY } from '@/constants/chains';
import type { CurrencyAmount } from '@/lib/entities/currency-amount';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';

interface ValidationResult {
  isDisabled: true;
  message: string;
}

const ALPHA_LIMITS: Record<string, { max: number; symbol: string }> = {
  SUI: { max: CHAIN_REGISTRY.sui.alphaMax, symbol: 'SUI' },
  SOL: { max: CHAIN_REGISTRY.solana.alphaMax, symbol: 'SOL' },
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

  const chainKey = token === 'SUI' ? 'sui' : 'solana';
  const config = CHAIN_REGISTRY[chainKey];

  const gasError = validateGasBalance({
    gasBalance,
    gasDecimals: config.decimals,
    minGas: config.minGas,
    amount: amountNum,
    isGasToken,
    symbol: token,
    displayDecimals: config.displayPrecision,
  });
  if (gasError) return gasError;

  return { isDisabled: false, message: null };
};

/**
 * CurrencyAmount-based swap validation — simpler API with fewer params.
 * Token carries its own decimals/chain info, so we derive everything.
 */
export const validateSwapAmount = (
  amount: CurrencyAmount,
  gasBalance: CurrencyAmount
): SwapValidationResult => {
  if (amount.isZero() || !amount.isPositive()) {
    return { isDisabled: true, message: 'Enter amount' };
  }

  const humanAmount = amount.toNumber();
  const symbol = amount.token.symbol as 'SUI' | 'SOL';

  const alphaError = validateAlphaLimit(symbol, humanAmount);
  if (alphaError) return alphaError;

  const config = CHAIN_REGISTRY[amount.token.chainId];
  const isGasToken = gasBalance.token.equals(amount.token);

  const gasError = validateGasBalance({
    gasBalance: gasBalance.raw,
    gasDecimals: config.decimals,
    minGas: config.minGas,
    amount: humanAmount,
    isGasToken,
    symbol,
    displayDecimals: config.displayPrecision,
  });
  if (gasError) return gasError;

  return { isDisabled: false, message: null };
};
