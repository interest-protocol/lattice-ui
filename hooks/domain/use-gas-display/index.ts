import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useBalances from '@/hooks/domain/use-balances';
import { FixedPointMath } from '@/lib/entities';
import { formatMoney } from '@/utils/money';

const CHAINS: readonly ChainKey[] = ['sui', 'solana'];

export interface GasDisplayItem {
  chain: ChainKey;
  config: (typeof CHAIN_REGISTRY)[ChainKey];
  display: string;
  loading: boolean;
}

const useGasDisplay = (): GasDisplayItem[] => {
  const { suiBalances, solanaBalances, suiLoading, solLoading } = useBalances();

  return CHAINS.map((chain) => {
    const config = CHAIN_REGISTRY[chain];
    const raw = chain === 'sui' ? suiBalances.sui : solanaBalances.sol;
    const amount = FixedPointMath.toNumber(raw, config.decimals);
    const display = formatMoney(amount, config.displayPrecision);
    const loading = chain === 'sui' ? suiLoading : solLoading;

    return { chain, config, display, loading };
  });
};

export default useGasDisplay;
