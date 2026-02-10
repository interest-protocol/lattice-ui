'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { ButtonHTMLAttributes, FC } from 'react';

const WalletGuardButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({
  children,
  ...props
}) => {
  const { ready, authenticated, login } = usePrivy();

  if (!ready)
    return (
      <button type="button" {...props} onClick={undefined} disabled>
        Connecting...
      </button>
    );

  if (!authenticated)
    return (
      <button type="button" {...props} onClick={login}>
        Connect Wallet
      </button>
    );

  return (
    <button type="button" {...props}>
      {children}
    </button>
  );
};

export default WalletGuardButton;
