import type { FC } from 'react';

import { CopySVG, LogoutSVG } from '@/components/ui/icons';
import Motion from '@/components/ui/motion';
import { toasting } from '@/components/ui/toast';

import type { WalletProfileDropdownProps } from './wallet-profile.types';

const WalletProfileDropdown: FC<
  WalletProfileDropdownProps & {
    displayAddress: string;
    fullAddress: string;
    onLogout: () => void;
  }
> = ({ close, displayAddress, fullAddress, onLogout }) => {
  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <Motion
      className="py-4 z-[1] mt-[4.25rem] gap-2 w-80 bg-surface-light text-white overflow-hidden absolute rounded-2xl flex-col hidden md:flex border border-surface-border"
      style={{ backdropFilter: 'blur(50px)', originY: 0, right: 0 }}
      exit={{ scaleY: 0 }}
      animate={{ scaleY: [0, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 flex flex-col gap-2">
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
          className="p-4 flex text-error cursor-pointer items-center justify-between border-t border-t-surface-border-hover hover:opacity-90 bg-transparent w-full"
          onClick={() => {
            onLogout();
            close();
          }}
        >
          <span>Disconnect</span>
          <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
        </button>
      </div>
    </Motion>
  );
};

export default WalletProfileDropdown;
