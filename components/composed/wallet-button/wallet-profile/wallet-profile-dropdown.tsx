'use client';

import { type FC, useState } from 'react';

import { CopySVG, LogoutSVG } from '@/components/ui/icons';
import Motion from '@/components/ui/motion';
import { toasting } from '@/components/ui/toast';
import ExplorerSection from './sections/explorer-section';
import RpcSection from './sections/rpc-section';
import ThemeSection from './sections/theme-section';
import type { WalletProfileDropdownProps } from './wallet-profile.types';

type MenuSection = 'explorer' | 'rpc' | 'theme' | null;

const WalletProfileDropdown: FC<
  WalletProfileDropdownProps & {
    displayAddress: string;
    fullAddress: string;
    onLogout: () => void;
  }
> = ({ close, displayAddress, fullAddress, onLogout }) => {
  const [menu, setMenu] = useState<MenuSection>(null);

  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <Motion
      className="py-2 z-[1] mt-[4.25rem] w-80 text-text overflow-hidden absolute rounded-2xl flex-col hidden md:flex border border-surface-border max-h-[70vh] overflow-y-auto"
      style={{
        backdropFilter: 'blur(24px)',
        originY: 0,
        right: 0,
        background: 'var(--color-surface-overlay)',
        boxShadow: 'var(--settings-shadow)',
      }}
      exit={{ scaleY: 0 }}
      animate={{ scaleY: [0, 1] }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 flex items-center justify-between">
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
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <ExplorerSection
        show={menu === 'explorer'}
        toggleShow={() => setMenu(menu === 'explorer' ? null : 'explorer')}
      />
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <RpcSection
        show={menu === 'rpc'}
        toggleShow={() => setMenu(menu === 'rpc' ? null : 'rpc')}
      />
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <ThemeSection
        show={menu === 'theme'}
        toggleShow={() => setMenu(menu === 'theme' ? null : 'theme')}
      />
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <button
        type="button"
        className="mx-4 py-3 flex text-error cursor-pointer items-center justify-between hover:opacity-90 bg-transparent border-none w-auto"
        onClick={() => {
          onLogout();
          close();
        }}
      >
        <span>Logout</span>
        <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
      </button>
    </Motion>
  );
};

export default WalletProfileDropdown;
