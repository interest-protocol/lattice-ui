import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';

import { useOnboarding } from '@/hooks/store/use-onboarding';

const useWalletRegistration = () => {
  const { user, authenticated, ready } = usePrivy();

  useEffect(() => {
    if (!ready || !authenticated || !user?.id) return;

    useOnboarding.getState().checkRegistration(user.id);
    return () => useOnboarding.getState().cleanup();
  }, [ready, authenticated, user?.id]);
};

export default useWalletRegistration;
