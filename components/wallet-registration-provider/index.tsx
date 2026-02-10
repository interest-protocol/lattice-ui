import useWalletRegistration from '@/hooks/use-wallet-registration';
import type { FC } from 'react';

const WalletRegistrationProvider: FC = () => {
  useWalletRegistration();
  return null;
};

export default WalletRegistrationProvider;
