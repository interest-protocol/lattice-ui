import { useCallback } from 'react';
import { useReadLocalStorage } from 'usehooks-ts';

import {
  EXPLORER_PATH_GETTER,
  EXPLORER_STORAGE_KEY,
  EXPLORER_URL_GETTER,
  Explorer,
  type ExplorerMode,
} from '@/constants';

export const useGetExplorerUrl = () => {
  const explorer =
    useReadLocalStorage<Explorer>(EXPLORER_STORAGE_KEY) ?? Explorer.SuiVision;

  return useCallback(
    (id: string, mode: ExplorerMode) =>
      EXPLORER_URL_GETTER[explorer](EXPLORER_PATH_GETTER[explorer][mode](id)),
    [explorer]
  );
};
