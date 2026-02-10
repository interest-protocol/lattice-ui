import type { FC } from 'react';

import WalletButton from '@/components/composed/wallet-button';
import { LogoSVG } from '@/components/ui/icons';
import GasBalances from './gas-balances';
import Navbar from './navbar';

const Header: FC = () => (
  <header className="mx-auto w-full flex max-w-[1440px] relative items-center p-2 sm:p-4 justify-between">
    <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <LogoSVG maxWidth="2rem" maxHeight="2rem" width="100%" />
        <h1 className="hidden md:block mx-auto text-white max-w-[20rem] text-4xl text-center font-pixel">
          Lattice
        </h1>
      </div>
      <Navbar />
    </div>
    <div className="flex items-center gap-2">
      <GasBalances />
      <WalletButton />
    </div>
  </header>
);

export default Header;
