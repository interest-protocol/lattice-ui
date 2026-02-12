'use client';

import { type FC, useState } from 'react';
import GasBalancesInline from '@/components/composed/wallet-button/wallet-profile/gas-balances-inline';
import ExplorerSection from '@/components/composed/wallet-button/wallet-profile/sections/explorer-section';
import RpcSection from '@/components/composed/wallet-button/wallet-profile/sections/rpc-section';
import SlippageSection from '@/components/composed/wallet-button/wallet-profile/sections/slippage-section';
import ThemeSection from '@/components/composed/wallet-button/wallet-profile/sections/theme-section';
import CopyButton from '@/components/ui/copy-button';
import { LogoutSVG } from '@/components/ui/icons';

type MenuSection = 'explorer' | 'rpc' | 'theme' | 'slippage' | null;

interface PanelContentProps {
  wallet?: { displayAddress: string; fullAddress: string };
  onLogout?: () => void;
}

const PanelContent: FC<PanelContentProps> = ({ wallet, onLogout }) => {
  const [menu, setMenu] = useState<MenuSection>(null);

  const isEmail = wallet?.fullAddress?.includes('@');

  return (
    <div className="flex flex-col gap-1">
      {wallet ? (
        <>
          <div className="flex items-center justify-between py-2">
            <span className={`${isEmail ? 'font-sans' : 'font-mono'} text-sm`}>
              {wallet.displayAddress}
            </span>
            {wallet.fullAddress ? (
              <CopyButton
                text={wallet.fullAddress}
                className="hover:text-accent"
                ariaLabel={isEmail ? 'Copy email' : 'Copy address'}
              />
            ) : null}
          </div>
          <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
          <GasBalancesInline />
          <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
        </>
      ) : null}
      <ThemeSection
        show={menu === 'theme'}
        toggleShow={() => setMenu(menu === 'theme' ? null : 'theme')}
      />
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
      <SlippageSection
        show={menu === 'slippage'}
        toggleShow={() => setMenu(menu === 'slippage' ? null : 'slippage')}
      />
      {onLogout ? (
        <>
          <hr className="border-b border-b-surface-border border-t-0 border-x-0" />
          <button
            type="button"
            aria-label="Logout"
            className="py-3 flex text-error cursor-pointer items-center justify-between hover:opacity-90 bg-transparent border-none w-full focus-ring rounded"
            onClick={onLogout}
          >
            <span>Logout</span>
            <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
          </button>
        </>
      ) : null}
    </div>
  );
};

export default PanelContent;
