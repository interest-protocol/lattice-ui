'use client';

import { type FC, useState } from 'react';

import { CopySVG, LogoutSVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';

import ExplorerSection from './sections/explorer-section';
import RpcSection from './sections/rpc-section';
import ThemeSection from './sections/theme-section';

type MenuSection = 'explorer' | 'rpc' | 'theme' | null;

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
  const [menu, setMenu] = useState<MenuSection>(null);

  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between px-1 py-2">
        <span className="font-mono text-sm">{displayAddress}</span>
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
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <ExplorerSection
        show={menu === 'explorer'}
        toggleShow={() => setMenu(menu === 'explorer' ? null : 'explorer')}
      />
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <RpcSection
        show={menu === 'rpc'}
        toggleShow={() => setMenu(menu === 'rpc' ? null : 'rpc')}
      />
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <ThemeSection
        show={menu === 'theme'}
        toggleShow={() => setMenu(menu === 'theme' ? null : 'theme')}
      />
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <button
        type="button"
        className="py-3 px-1 flex text-error cursor-pointer items-center justify-between hover:opacity-90 bg-transparent border-none w-full"
        onClick={() => {
          onLogout();
          onClose();
        }}
      >
        <span>Logout</span>
        <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
      </button>
    </div>
  );
};

export default WalletProfileModal;
