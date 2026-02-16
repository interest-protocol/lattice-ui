import type { ChainKey } from '@/constants/chains';
import useBalances from '@/hooks/domain/use-balances';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils/money';

interface UseChainBalanceReturn {
  getBalanceByIndex: (index: number) => bigint;
  isLoading: boolean;
  formatBalance: (
    balance: bigint,
    decimals: number,
    precision?: number
  ) => string;
  toHumanAmount: (balance: bigint, decimals: number) => number;
}

const useChainBalance = (network: ChainKey): UseChainBalanceReturn => {
  const { suiBalances, solanaBalances, suiLoading, solLoading } = useBalances();

  const getBalanceByIndex = (index: number): bigint => {
    if (network === 'sui') {
      return index === 0 ? suiBalances.sui : suiBalances.wsol;
    }
    return index === 0 ? solanaBalances.sol : solanaBalances.wsui;
  };

  const isLoading = network === 'sui' ? suiLoading : solLoading;

  const toHumanAmount = (balance: bigint, decimals: number): number =>
    FixedPointMath.toNumber(balance, decimals);

  const formatBalance = (
    balance: bigint,
    decimals: number,
    precision = 6
  ): string =>
    formatMoney(FixedPointMath.toNumber(balance, decimals), precision);

  return { getBalanceByIndex, isLoading, formatBalance, toHumanAmount };
};

export default useChainBalance;
