'use client';

import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Img, Span } from '@stylin.js/elements';
import { AnimatePresence } from 'motion/react';
import { not } from 'ramda';
import { FC, useMemo, useState } from 'react';

import { ChevronDownSVG } from '@/components/svg';
import useClickOutsideListenerRef from '@/hooks/use-click-outside-listener-ref';
import { useModal } from '@/hooks/use-modal';

import WalletProfileDropdown from './wallet-profile-dropdown';
import WalletProfileModal from './wallet-profile-modal';

const formatDisplay = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

const WalletProfile: FC = () => {
  const { user, logout } = usePrivy();
  const { setContent, handleClose } = useModal();
  const [isOpen, setOpen] = useState(false);
  const menuRef = useClickOutsideListenerRef<HTMLDivElement>(() =>
    setOpen(false)
  );

  const displayAddress = useMemo(() => {
    if (!user) return '';
    const wallet = user.wallet ?? user.linkedAccounts?.find((a) => a.type === 'wallet');
    const addr = wallet && 'address' in wallet ? wallet.address : null;
    if (addr) return formatDisplay(addr);
    const email = user.email?.address ?? user.google?.email;
    return email ?? 'Logged in';
  }, [user]);

  const fullAddress = useMemo(() => {
    if (!user) return '';
    const wallet = user.wallet ?? user.linkedAccounts?.find((a) => a.type === 'wallet');
    return wallet && 'address' in wallet ? wallet.address : '';
  }, [user]);

  const handleOpenProfileDropdown = () => setOpen(not);
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
      <Div
        ref={menuRef}
        alignItems="flex-end"
        flexDirection="column"
        display={['none', 'none', 'flex']}
      >
        <Button
          all="unset"
          py="0.75rem"
          gap="0.5rem"
          display="flex"
          bg="#A78BFA1A"
          color="#F1F1F1"
          cursor="pointer"
          alignItems="center"
          borderRadius="0.5rem"
          px={['0.75rem', '1rem']}
          nHover={{ bg: '#A78BFA33' }}
          onClick={handleOpenProfileDropdown}
        >
          <Img
            alt="Account"
            width="1.5rem"
            height="1.5rem"
            borderRadius="50%"
            src="/icon.svg"
          />
          <Span whiteSpace="nowrap">{displayAddress}</Span>
          <Span display={['none', 'flex']} alignItems="center" ml="0.25rem">
            <ChevronDownSVG
              width="100%"
              maxWidth="0.65rem"
              maxHeight="0.65rem"
            />
          </Span>
        </Button>
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
      </Div>
      <Button
        all="unset"
        gap="0.25rem"
        bg="#A78BFA1A"
        color="#F1F1F1"
        cursor="pointer"
        alignItems="center"
        borderRadius="0.5rem"
        py={['0.625rem', '1rem']}
        px={['0.5rem', '1.5rem']}
        onClick={handleOpenProfileModal}
        fontSize={['0.75rem', '0.875rem']}
        display={['flex', 'flex', 'none']}
      >
        <Img
          alt="Account"
          width="1rem"
          height="1rem"
          borderRadius="50%"
          src="/icon.svg"
          style={{ padding: 2 }}
        />
        {displayAddress}
        <Span display={['none', 'inline']}>
          <ChevronDownSVG maxWidth="0.65rem" maxHeight="0.65rem" width="100%" />
        </Span>
      </Button>
    </>
  );
};

export default WalletProfile;
