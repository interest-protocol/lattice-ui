import type { FC } from 'react';

import Settings from '@/components/composed/settings';
import WalletButton from '@/components/composed/wallet-button';
import { LogoSVG } from '@/components/ui/icons';
import GasBalances from './gas-balances';
import Navbar from './navbar';

const Header: FC = () => (
  <header
    className="mx-auto w-full flex max-w-[1440px] relative items-center px-4 sm:px-6 py-3 sm:py-4 justify-between"
    style={{ borderBottom: '1px solid var(--color-header-border)' }}
  >
    <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <LogoSVG maxWidth="2rem" maxHeight="2rem" width="100%" />
        <h1 className="hidden md:block mx-auto text-text max-w-[20rem] text-xl text-center font-bold tracking-tight uppercase">
          Lattice
        </h1>
      </div>
      <Navbar />
    </div>
    <div className="flex items-center gap-2">
      <GasBalances />
      <Settings />
      <WalletButton />
    </div>
  </header>
);

export default Header;
