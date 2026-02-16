import { ExplorerMode, SolanaExplorerMode } from '@/constants';
import type { ChainKey } from '@/constants/chains';
import { useGetExplorerUrl } from '@/hooks/domain/use-get-explorer-url';
import { useGetSolanaExplorerUrl } from '@/hooks/domain/use-get-solana-explorer-url';

/**
 * Returns a function that builds an explorer transaction URL for the given chain.
 * Consolidates the chain-switching pattern used in success modals.
 */
export const useGetChainExplorerUrl = () => {
  const getSuiUrl = useGetExplorerUrl();
  const getSolanaUrl = useGetSolanaExplorerUrl();

  return (txDigest: string, chain: ChainKey) =>
    chain === 'sui'
      ? getSuiUrl(txDigest, ExplorerMode.Transaction)
      : getSolanaUrl(txDigest, SolanaExplorerMode.Transaction);
};
