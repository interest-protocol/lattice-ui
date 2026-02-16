import type { FC } from 'react';

import usePresignGuard from '@/hooks/domain/use-presign-guard';

const PresignGuardProvider: FC = () => {
  usePresignGuard();
  return null;
};

export default PresignGuardProvider;
