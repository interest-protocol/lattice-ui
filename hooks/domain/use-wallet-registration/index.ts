import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { useOnboarding } from '@/hooks/store/use-onboarding';

const useWalletRegistration = () => {
  const { user, authenticated, ready } = usePrivy();
  const queryClient = useQueryClient();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (!ready) return;

    if (authenticated && user?.id) {
      wasAuthenticated.current = true;
      useOnboarding.getState().checkRegistration(user.id);
      return () => useOnboarding.getState().reset();
    }

    // User just logged out — clear stale balance queries
    if (wasAuthenticated.current) {
      wasAuthenticated.current = false;
      useOnboarding.getState().reset();
      queryClient.removeQueries({ queryKey: ['sui-balances'] });
      queryClient.removeQueries({ queryKey: ['solana-balances'] });
    }
  }, [ready, authenticated, user?.id, queryClient]);
};

export default useWalletRegistration;
