import { useReadLocalStorage } from 'usehooks-ts';

import {
  SOLANA_EXPLORER_PATH_GETTER,
  SOLANA_EXPLORER_STORAGE_KEY,
  SOLANA_EXPLORER_URL_GETTER,
  SolanaExplorer,
  type SolanaExplorerMode,
} from '@/constants';

export const useGetSolanaExplorerUrl = () => {
  const explorer =
    useReadLocalStorage<SolanaExplorer>(SOLANA_EXPLORER_STORAGE_KEY) ??
    SolanaExplorer.Solscan;

  return (id: string, mode: SolanaExplorerMode) =>
    SOLANA_EXPLORER_URL_GETTER[explorer](
      SOLANA_EXPLORER_PATH_GETTER[explorer][mode](id)
    );
};
