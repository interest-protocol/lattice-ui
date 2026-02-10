'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button, type ButtonProps } from '@stylin.js/elements';
import type { FC } from 'react';

const WalletGuardButton: FC<ButtonProps> = ({ children, ...props }) => {
  const { ready, authenticated, login } = usePrivy();

  if (!ready)
    return (
      <Button {...props} onClick={undefined} disabled>
        Connecting...
      </Button>
    );

  if (!authenticated)
    return (
      <Button {...props} onClick={login}>
        Connect Wallet
      </Button>
    );

  return <Button {...props}>{children}</Button>;
};

export default WalletGuardButton;
