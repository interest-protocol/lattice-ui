import { CHAIN_REGISTRY } from '@/constants/chains';
import { parseUnits } from '@/lib/bigint-utils';
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
  gasBalance: bigint;
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
  const gasNeeded = parseUnits(String(minGas), gasDecimals);
  const amountRaw = isGasToken ? parseUnits(String(amount), gasDecimals) : 0n;
  const totalNeeded = gasNeeded + amountRaw;

  if (gasBalance < totalNeeded) {
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
  gasBalance: bigint;
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
