import type { FC } from 'react';

import { WalletSVG } from '@/components/ui/icons';

interface ConnectWalletProps {
  onConnect: () => void;
}

const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect }) => (
  <button
    type="button"
    className="bg-accent flex text-black cursor-pointer relative items-center rounded-xl gap-2 sm:gap-4 py-3 sm:py-4 px-3 sm:px-6 border-none"
    style={{ backdropFilter: 'blur(16px)' }}
    onClick={onConnect}
  >
    <WalletSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
    <span>
      Connect <span className="hidden sm:inline">Wallet</span>
    </span>
  </button>
);

export default ConnectWallet;
