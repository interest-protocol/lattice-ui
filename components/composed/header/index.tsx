import type { FC } from 'react';

import WalletButton from '@/components/composed/wallet-button';
import { LogoSVG } from '@/components/ui/icons';
import HeaderSettings from './header-settings';
import Navbar from './navbar';

const Header: FC = () => (
  <header
    className="mx-auto w-full flex max-w-[1440px] relative items-center px-4 sm:px-6 py-3 sm:py-4 justify-between"
    style={{
      borderBottom: '1px solid var(--color-header-border)',
      background: 'var(--color-header-bg)',
      backdropFilter: 'blur(var(--blur-lg)) saturate(1.4)',
    }}
  >
    <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
      <div className="flex items-center gap-4">
        <div
          style={{ filter: 'drop-shadow(0 0 8px var(--color-accent-muted))' }}
        >
          <LogoSVG
            maxWidth="2rem"
            maxHeight="2rem"
            width="100%"
            className="text-accent"
          />
        </div>
        <h1 className="hidden md:block mx-auto text-text max-w-[20rem] text-xl text-center font-bold tracking-[0.08em] uppercase">
          Lattice
        </h1>
      </div>
      <Navbar />
    </div>
    <div className="flex items-center gap-2 md:gap-3">
      <HeaderSettings />
      <WalletButton />
    </div>
  </header>
);

export default Header;
