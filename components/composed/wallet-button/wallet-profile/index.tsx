'use client';

import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import type { FC } from 'react';

import PanelContent from '@/components/composed/panel-content';
import { ChevronDownSVG, EmailSVG, WalletSVG } from '@/components/ui/icons';
import useLoginIdentity from '@/hooks/domain/use-login-identity';
import { useModal } from '@/hooks/store/use-modal';
import { useSidePanel } from '@/hooks/store/use-side-panel';
import { formatAddress, formatEmail } from '@/utils';

const WalletIcon: FC<{ icon?: string; px: number }> = ({ icon, px }) => {
  if (icon) {
    return (
      <Image
        src={icon.trim()}
        alt="Wallet"
        width={px}
        height={px}
        className="rounded-sm flex-shrink-0"
        style={{ width: px, height: px }}
        unoptimized
      />
    );
  }
  return (
    <WalletSVG
      maxWidth={`${px}px`}
      maxHeight={`${px}px`}
      className="text-accent flex-shrink-0"
    />
  );
};

const WalletProfile: FC = () => {
  const { logout } = usePrivy();
  const openPanel = useSidePanel((s) => s.open);
  const setModalContent = useModal((s) => s.setContent);
  const handleModalClose = useModal((s) => s.handleClose);

  const identity = useLoginIdentity();

  const displayText =
    identity.method === 'email'
      ? formatEmail(identity.rawValue)
      : formatAddress(identity.rawValue);

  const fullAddress = identity.rawValue;

  const handleDesktop = () => {
    const closePanel = useSidePanel.getState().close;
    openPanel(
      <PanelContent
        wallet={{ displayAddress: displayText, fullAddress }}
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
        wallet={{ displayAddress: displayText, fullAddress }}
        onLogout={() => {
          logout();
          handleModalClose();
        }}
      />,
      { title: 'Account' }
    );
  };

  const renderIcon = (px: number) => {
    if (identity.method === 'email') {
      return (
        <EmailSVG
          maxWidth={`${px}px`}
          maxHeight={`${px}px`}
          className="text-accent flex-shrink-0"
        />
      );
    }
    return <WalletIcon icon={identity.walletIcon} px={px} />;
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open account menu"
        className="py-3 gap-2 hidden md:flex bg-surface-raised text-text cursor-pointer items-center rounded-xl px-4 border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200 focus-ring"
        onClick={handleDesktop}
      >
        {renderIcon(20)}
        <span className="whitespace-nowrap">{displayText}</span>
        <span className="hidden sm:flex items-center ml-1">
          <ChevronDownSVG width="100%" maxWidth="0.65rem" maxHeight="0.65rem" />
        </span>
      </button>
      <button
        type="button"
        aria-label="Open account menu"
        className="flex md:hidden gap-1.5 bg-surface-raised text-text cursor-pointer items-center rounded-xl py-2.5 px-2.5 sm:px-3 text-sm border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200 focus-ring"
        onClick={handleMobile}
      >
        {renderIcon(18)}
        {displayText}
        <span className="hidden sm:inline">
          <ChevronDownSVG maxWidth="0.65rem" maxHeight="0.65rem" width="100%" />
        </span>
      </button>
    </>
  );
};

export default WalletProfile;
