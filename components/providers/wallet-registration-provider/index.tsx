import type { FC } from 'react';
import useWalletRegistration from '@/hooks/domain/use-wallet-registration';

const WalletRegistrationProvider: FC = () => {
  useWalletRegistration();
  return null;
};

export default WalletRegistrationProvider;
