import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef } from 'react';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { post } from '@/lib/api/client';

const usePresignGuard = () => {
  const { authenticated, ready, user } = usePrivy();
  const step = useOnboarding((s) => s.step);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || !user?.id || step !== 'complete') return;
    if (calledRef.current) return;

    calledRef.current = true;

    post(
      '/api/presign/ensure',
      { userId: user.id },
      {
        timeout: 30_000,
        retries: 0,
      }
    ).catch((err) => {
      console.warn('[presign-guard] ensure failed:', err);
    });
  }, [ready, authenticated, user?.id, step]);
};

export default usePresignGuard;
