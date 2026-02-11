import type { FC } from 'react';

import { WalletSVG } from '@/components/ui/icons';

interface ConnectWalletProps {
  onConnect: () => void;
}

const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect }) => (
  <button
    type="button"
    className="flex text-white cursor-pointer relative items-center rounded-xl gap-2 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 border-none font-semibold transition-all duration-200"
    style={{
      background: 'var(--btn-primary-bg)',
      boxShadow: 'var(--btn-primary-shadow)',
      backdropFilter: 'blur(16px)',
    }}
    onClick={onConnect}
  >
    <WalletSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
    <span>
      Connect <span className="hidden sm:inline">Wallet</span>
    </span>
  </button>
);

export default ConnectWallet;
