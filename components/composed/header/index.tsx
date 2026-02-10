import { Div, H1, Header as HTMLHeader } from '@stylin.js/elements';
import type { FC } from 'react';

import { LogoSVG } from '@/components/ui/icons';
import WalletButton from '@/components/composed/wallet-button';
import Navbar from './navbar';

const Header: FC = () => (
  <HTMLHeader
    mx="auto"
    width="100%"
    display="flex"
    maxWidth="1440px"
    position="relative"
    alignItems="center"
    p={['0.5rem', '1rem']}
    justifyContent="space-between"
  >
    <Div display="flex" alignItems="center" gap={['0.5rem', '1rem', '2rem']}>
      <Div display="flex" alignItems="center" gap="1rem">
        <LogoSVG maxWidth="2rem" maxHeight="2rem" width="100%" />
        <H1
          mx="auto"
          color="#FFFFFF"
          maxWidth="20rem"
          fontSize="2.25rem"
          textAlign="center"
          fontFamily="PPNeueBit"
          display={['none', 'none', 'block']}
        >
          Lattice
        </H1>
      </Div>
      <Navbar />
    </Div>
    <WalletButton />
  </HTMLHeader>
);

export default Header;
