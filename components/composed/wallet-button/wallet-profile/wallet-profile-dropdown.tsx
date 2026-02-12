'use client';

import { type FC, useState } from 'react';

import CopyButton from '@/components/ui/copy-button';
import { LogoutSVG } from '@/components/ui/icons';
import Motion from '@/components/ui/motion';
import { Z_INDEX } from '@/constants/z-index';
import GasBalancesInline from './gas-balances-inline';
import ExplorerSection from './sections/explorer-section';
import RpcSection from './sections/rpc-section';
import SlippageSection from './sections/slippage-section';
import ThemeSection from './sections/theme-section';
import type { WalletProfileDropdownProps } from './wallet-profile.types';

type MenuSection = 'explorer' | 'rpc' | 'theme' | 'slippage' | null;

const WalletProfileDropdown: FC<
  WalletProfileDropdownProps & {
    displayAddress: string;
    fullAddress: string;
    onLogout: () => void;
  }
> = ({ close, displayAddress, fullAddress, onLogout }) => {
  const [menu, setMenu] = useState<MenuSection>(null);

  return (
    <Motion
      className="py-2 mt-[4.25rem] w-80 text-text overflow-hidden absolute rounded-2xl flex-col hidden md:flex border border-surface-border max-h-[70vh] overflow-y-auto"
      style={{
        zIndex: Z_INDEX.DROPDOWN,
        backdropFilter: `blur(var(--blur-lg))`,
        originY: 0,
        right: 0,
        background: 'var(--color-surface-overlay)',
        boxShadow: 'var(--settings-shadow)',
      }}
      exit={{ scaleY: 0, filter: 'blur(4px)' }}
      animate={{ scaleY: [0, 1], filter: ['blur(4px)', 'blur(0px)'] }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-sm">{displayAddress}</span>
        {fullAddress ? (
          <CopyButton
            text={fullAddress}
            className="hover:text-accent"
            ariaLabel="Copy address"
          />
        ) : null}
      </div>
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <GasBalancesInline />
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
      <SlippageSection
        show={menu === 'slippage'}
        toggleShow={() => setMenu(menu === 'slippage' ? null : 'slippage')}
      />
      <hr className="border-b border-b-surface-border mx-4 border-t-0 border-x-0" />
      <button
        type="button"
        className="mx-4 py-3 flex text-error cursor-pointer items-center justify-between hover:opacity-90 bg-transparent border-none w-auto focus-ring rounded"
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
