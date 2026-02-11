'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { FC } from 'react';

import Settings from '@/components/composed/settings';

const HeaderSettings: FC = () => {
  const { authenticated } = usePrivy();

  if (authenticated) return null;

  return <Settings />;
};

export default HeaderSettings;
