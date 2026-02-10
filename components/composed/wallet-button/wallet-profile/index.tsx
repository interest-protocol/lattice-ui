'use client';

import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { type FC, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { ChevronDownSVG } from '@/components/ui/icons';
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

  const displayAddress = useMemo(() => {
    if (!user) return '';
    const wallet =
      user.wallet ?? user.linkedAccounts?.find((a) => a.type === 'wallet');
    const addr = wallet && 'address' in wallet ? wallet.address : null;
    if (addr) return formatAddress(addr);
    const email = user.email?.address ?? user.google?.email;
    return email ?? 'Logged in';
  }, [user]);

  const fullAddress = useMemo(() => {
    if (!user) return '';
    const wallet =
      user.wallet ?? user.linkedAccounts?.find((a) => a.type === 'wallet');
    return wallet && 'address' in wallet ? wallet.address : '';
  }, [user]);

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
          className="py-3 gap-2 flex bg-accent-1a text-[#F1F1F1] cursor-pointer items-center rounded-lg px-3 sm:px-4 border-none hover:bg-accent-33"
          onClick={handleOpenProfileDropdown}
        >
          <Image
            alt="Account"
            className="rounded-full"
            src="/icon.svg"
            width={24}
            height={24}
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
        <AnimatePresence>
          {isOpen && (
            <WalletProfileDropdown
              close={() => setOpen(false)}
              displayAddress={displayAddress}
              fullAddress={fullAddress}
              onLogout={logout}
            />
          )}
        </AnimatePresence>
      </div>
      <button
        type="button"
        className="flex md:hidden gap-1 bg-accent-1a text-[#F1F1F1] cursor-pointer items-center rounded-lg py-2.5 sm:py-4 px-2 sm:px-6 text-xs sm:text-sm border-none"
        onClick={handleOpenProfileModal}
      >
        <Image
          alt="Account"
          className="rounded-full"
          src="/icon.svg"
          width={16}
          height={16}
          style={{ padding: 2 }}
        />
        {displayAddress}
        <span className="hidden sm:inline">
          <ChevronDownSVG maxWidth="0.65rem" maxHeight="0.65rem" width="100%" />
        </span>
      </button>
    </>
  );
};

export default WalletProfile;
