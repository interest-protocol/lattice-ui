'use client';

import { type FC, useState } from 'react';

import CopyButton from '@/components/ui/copy-button';
import { LogoutSVG } from '@/components/ui/icons';

import GasBalancesInline from './gas-balances-inline';
import ExplorerSection from './sections/explorer-section';
import RpcSection from './sections/rpc-section';
import SlippageSection from './sections/slippage-section';
import ThemeSection from './sections/theme-section';

type MenuSection = 'explorer' | 'rpc' | 'theme' | 'slippage' | null;

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

  return (
    <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between px-1 py-2">
        <span className="font-mono text-sm">{displayAddress}</span>
        {fullAddress ? (
          <CopyButton
            text={fullAddress}
            className="hover:text-accent"
            ariaLabel="Copy address"
          />
        ) : null}
      </div>
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <GasBalancesInline />
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
      <SlippageSection
        show={menu === 'slippage'}
        toggleShow={() => setMenu(menu === 'slippage' ? null : 'slippage')}
      />
      <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
      <button
        type="button"
        className="py-3 px-1 flex text-error cursor-pointer items-center justify-between hover:opacity-90 bg-transparent border-none w-full focus-ring rounded"
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
