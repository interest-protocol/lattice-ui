import { type FC, useEffect } from 'react';

import { useAppState } from '@/hooks/use-app-state';

/** UI-only: no chain data. Just sets loading states to false so UI doesn't hang. */
const AppStateProvider: FC = () => {
  const { update, loadingCoins, loadingObjects } = useAppState();

  useEffect(() => {
    // Only update if we're still in initial loading state
    if (loadingCoins || loadingObjects) {
      update({
        loadingCoins: false,
        loadingObjects: false,
        balances: {},
        mutate: () => {},
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - run only on mount

  return null;
};

export default AppStateProvider;
