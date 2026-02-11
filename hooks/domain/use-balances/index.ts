import { SUI_TYPE_ARG } from '@mysten/sui/utils';

import { WSOL_SUI_TYPE, WSUI_SOLANA_MINT } from '@/constants';
import { SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { normalizeSuiCoinType } from '@/utils/sui';

import type {
  UseBalancesOptions,
  UseBalancesReturn,
} from './use-balances.types';

const useBalances = (options?: UseBalancesOptions): UseBalancesReturn => {
  const { getAddress } = useWalletAddresses();

  const suiAddress =
    options?.suiAddress !== undefined ? options.suiAddress : getAddress('sui');
  const solanaAddress = getAddress('solana');

  const {
    balances: suiBalances,
    amounts: suiAmounts,
    isLoading: suiLoading,
    mutate: mutateSuiBalances,
  } = useSuiBalances(suiAddress);

  const {
    balances: solanaBalances,
    amounts: solanaAmounts,
    isLoading: solLoading,
    mutate: mutateSolanaBalances,
  } = useSolanaBalances(solanaAddress);

  const allBalances: Record<string, bigint> = {
    [normalizeSuiCoinType(SUI_TYPE_ARG)]: suiBalances.sui,
    [SOL_TYPE]: solanaBalances.sol,
    [normalizeSuiCoinType(WSOL_SUI_TYPE)]: suiBalances.wsol,
    [WSUI_SOLANA_MINT]: solanaBalances.wsui,
  };

  const getBalance = (type: string): bigint =>
    allBalances[normalizeSuiCoinType(type)] ?? allBalances[type] ?? 0n;

  return {
    suiAddress,
    solanaAddress,
    suiBalances,
    solanaBalances,
    suiAmounts,
    solanaAmounts,
    suiLoading,
    solLoading,
    isLoading: suiLoading || solLoading,
    mutateSuiBalances,
    mutateSolanaBalances,
    getBalance,
    allBalances,
  };
};

export default useBalances;
