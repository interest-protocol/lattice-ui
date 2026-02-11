'use client';

import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence } from 'motion/react';
import { type FC, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDownSVG, LogoSVG } from '@/components/ui/icons';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useModal } from '@/hooks/store/use-modal';
import useClickOutsideListenerRef from '@/hooks/ui/use-click-outside-listener-ref';
import { formatAddress } from '@/utils';

import WalletProfileDropdown from './wallet-profile-dropdown';
import WalletProfileModal from './wallet-profile-modal';

const WalletProfile: FC = () => {
  const { user, logout } = usePrivy();
  const { setContent, handleClose } = useModal(
    useShallow((s) => ({
      setContent: s.setContent,
      handleClose: s.handleClose,
    }))
  );
  const [isOpen, setOpen] = useState(false);
  const menuRef = useClickOutsideListenerRef<HTMLDivElement>(() =>
    setOpen(false)
  );

  const { getAddress } = useWalletAddresses();
  const walletAddr = getAddress('sui') ?? getAddress('solana');

  const displayAddress = (() => {
    if (!user) return '';
    if (walletAddr) return formatAddress(walletAddr);
    const email = user.email?.address ?? user.google?.email;
    return email ?? 'Logged in';
  })();

  const fullAddress = walletAddr ?? '';

  const handleOpenProfileDropdown = () => setOpen((prev) => !prev);
  const handleOpenProfileModal = () =>
    setContent(
      <WalletProfileModal
        displayAddress={displayAddress}
        fullAddress={fullAddress}
        onLogout={() => {
          logout();
          handleClose();
        }}
        onClose={handleClose}
      />,
      { title: 'Account' }
    );

  return (
    <>
      <div ref={menuRef} className="items-end flex-col hidden md:flex">
        <button
          type="button"
          className="py-3 gap-2 flex bg-surface-raised text-text cursor-pointer items-center rounded-lg px-3 sm:px-4 border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200"
          onClick={handleOpenProfileDropdown}
        >
          <LogoSVG maxWidth="1.25rem" maxHeight="1.25rem" className="text-accent" />
          <span className="whitespace-nowrap">{displayAddress}</span>
          <span className="hidden sm:flex items-center ml-1">
            <ChevronDownSVG
              width="100%"
              maxWidth="0.65rem"
              maxHeight="0.65rem"
            />
          </span>
        </button>
        <AnimatePresence>
          {isOpen ? (
            <WalletProfileDropdown
              close={() => setOpen(false)}
              displayAddress={displayAddress}
              fullAddress={fullAddress}
              onLogout={logout}
            />
          ) : null}
        </AnimatePresence>
      </div>
      <button
        type="button"
        className="flex md:hidden gap-1 bg-surface-raised text-text cursor-pointer items-center rounded-lg py-2.5 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm border border-surface-border hover:border-surface-border-hover hover:bg-surface-overlay transition-colors duration-200"
        onClick={handleOpenProfileModal}
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
