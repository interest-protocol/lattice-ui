'use client';

import { usePrivy } from '@privy-io/react-auth';
import type { FC } from 'react';

import PanelContent from '@/components/composed/panel-content';
import { ChevronDownSVG, LogoSVG } from '@/components/ui/icons';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useModal } from '@/hooks/store/use-modal';
import { useSidePanel } from '@/hooks/store/use-side-panel';
import { formatAddress } from '@/utils';

const WalletProfile: FC = () => {
  const { user, logout } = usePrivy();
  const openPanel = useSidePanel((s) => s.open);
  const setModalContent = useModal((s) => s.setContent);
  const handleModalClose = useModal((s) => s.handleClose);

  const { getAddress } = useWalletAddresses();
  const walletAddr = getAddress('sui') ?? getAddress('solana');

  const displayAddress = (() => {
    if (!user) return '';
    if (walletAddr) return formatAddress(walletAddr);
    const email = user.email?.address ?? user.google?.email;
    return email ?? 'Logged in';
  })();

  const fullAddress = walletAddr ?? '';

  const handleDesktop = () => {
    const closePanel = useSidePanel.getState().close;
    openPanel(
      <PanelContent
        wallet={{ displayAddress, fullAddress }}
        onLogout={() => {
          logout();
          closePanel();
        }}
      />,
      { title: 'Account' }
    );
  };

  const handleMobile = () => {
    setModalContent(
      <PanelContent
        wallet={{ displayAddress, fullAddress }}
        onLogout={() => {
          logout();
          handleModalClose();
        }}
      />,
      { title: 'Account' }
    );
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open account menu"
        className="py-3 gap-2 hidden md:flex bg-surface-raised text-text cursor-pointer items-center rounded-lg px-3 sm:px-4 border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200 focus-ring"
        onClick={handleDesktop}
      >
        <LogoSVG
          maxWidth="1.25rem"
          maxHeight="1.25rem"
          className="text-accent"
        />
        <span className="whitespace-nowrap">{displayAddress}</span>
        <span className="hidden sm:flex items-center ml-1">
          <ChevronDownSVG
            width="100%"
            maxWidth="0.65rem"
            maxHeight="0.65rem"
          />
        </span>
      </button>
      <button
        type="button"
        aria-label="Open account menu"
        className="flex md:hidden gap-1 bg-surface-raised text-text cursor-pointer items-center rounded-lg py-2.5 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200 focus-ring"
        onClick={handleMobile}
      >
        <LogoSVG maxWidth="1rem" maxHeight="1rem" className="text-accent" />
        {displayAddress}
        <span className="hidden sm:inline">
          <ChevronDownSVG maxWidth="0.65rem" maxHeight="0.65rem" width="100%" />
        </span>
      </button>
    </>
  );
};

export default WalletProfile;
