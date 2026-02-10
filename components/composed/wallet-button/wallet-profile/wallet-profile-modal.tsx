import type { FC } from 'react';

import { CopySVG, LogoutSVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';

interface WalletProfileModalProps {
  displayAddress: string;
  fullAddress: string;
  onLogout: () => void;
  onClose: () => void;
}

const WalletProfileModal: FC<WalletProfileModalProps> = ({
  displayAddress,
  fullAddress,
  onLogout,
  onClose,
}) => {
  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono">{displayAddress}</span>
        {fullAddress && (
          <button
            type="button"
            className="cursor-pointer hover:text-accent bg-transparent border-none p-0"
            onClick={copyAddress}
            aria-label="Copy address"
          >
            <CopySVG width="100%" maxWidth="1rem" maxHeight="1rem" />
          </button>
        )}
      </div>
      <button
        type="button"
        className="p-4 flex text-[#E53E3E] cursor-pointer items-center justify-between rounded-lg border border-[#FFFFFF33] hover:opacity-90 bg-transparent w-full"
        onClick={() => {
          onLogout();
          onClose();
        }}
      >
        <span>Disconnect</span>
        <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
      </button>
    </div>
  );
};

export default WalletProfileModal;
