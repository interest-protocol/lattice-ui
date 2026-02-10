import { Button, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { WalletSVG } from '@/components/svg';

interface ConnectWalletProps {
  onConnect: () => void;
}

const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect }) => (
  <Button
    all="unset"
    bg="#A78BFA"
    display="flex"
    color="#000000"
    cursor="pointer"
    position="relative"
    alignItems="center"
    borderRadius="0.75rem"
    gap={['0.5rem', '1rem']}
    py={['0.75rem', '1rem']}
    px={['0.75rem', '1.5rem']}
    backdropFilter="blur(16px)"
    onClick={onConnect}
  >
    <WalletSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
    <Span>
      Connect <Span display={['none', 'inline']}>Wallet</Span>
    </Span>
  </Button>
);

export default ConnectWallet;
