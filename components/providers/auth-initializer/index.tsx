'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';

import { setAccessTokenGetter } from '@/lib/api/client';

const AuthInitializer = () => {
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    setAccessTokenGetter(getAccessToken);
  }, [getAccessToken]);

  return null;
};

export default AuthInitializer;
