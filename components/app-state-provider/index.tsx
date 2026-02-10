import { type FC, useEffect } from 'react';

import { useAppState } from '@/hooks/use-app-state';

/** UI-only: no chain data. Just sets loading states to false so UI doesn't hang. */
const AppStateProvider: FC = () => {
  const { update } = useAppState();

  useEffect(() => {
    update({
      loadingCoins: false,
      loadingObjects: false,
      balances: {},
      mutate: () => {},
    });
  }, [update]);

  return null;
};

export default AppStateProvider;
