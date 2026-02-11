import type { FC } from 'react';
import useGasGuard from '@/hooks/domain/use-gas-guard';

const GasGuardProvider: FC = () => {
  useGasGuard();
  return null;
};

export default GasGuardProvider;
