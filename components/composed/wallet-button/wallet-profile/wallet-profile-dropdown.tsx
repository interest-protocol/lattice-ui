import { Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import Motion from '@/components/ui/motion';
import { CopySVG, LogoutSVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';

import type { WalletProfileDropdownProps } from './wallet-profile.types';

const WalletProfileDropdown: FC<
  WalletProfileDropdownProps & {
    displayAddress: string;
    fullAddress: string;
    onLogout: () => void;
  }
> = ({ close, displayAddress, fullAddress, onLogout }) => {
  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <Motion
      py="1rem"
      zIndex="1"
      mt="4.25rem"
      gap="0.5rem"
      width="20rem"
      bg="#FFFFFF0D"
      color="#ffffff"
      overflow="hidden"
      position="absolute"
      borderRadius="1rem"
      exit={{ scaleY: 0 }}
      flexDirection="column"
      style={{ originY: 0 }}
      backdropFilter="blur(50px)"
      right={['0.5rem', 'unset']}
      animate={{ scaleY: [0, 1] }}
      border="1px solid #FFFFFF1A"
      display={['none', 'none', 'flex']}
      onClick={(e) => e.stopPropagation()}
    >
      <Div
        px="1rem"
        py="0.5rem"
        display="flex"
        flexDirection="column"
        gap="0.5rem"
      >
        <Div display="flex" alignItems="center" justifyContent="space-between">
          <Span fontFamily="JetBrains Mono">{displayAddress}</Span>
          {fullAddress && (
            <Span
              cursor="pointer"
              onClick={copyAddress}
              nHover={{ color: '#A78BFA' }}
            >
              <CopySVG width="100%" maxWidth="1rem" maxHeight="1rem" />
            </Span>
          )}
        </Div>
        <Div
          p="1rem"
          display="flex"
          color="#E53E3E"
          cursor="pointer"
          alignItems="center"
          justifyContent="space-between"
          borderTop="1px solid #FFFFFF33"
          onClick={() => {
            onLogout();
            close();
          }}
          nHover={{ opacity: 0.9 }}
        >
          <Span>Disconnect</Span>
          <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
        </Div>
      </Div>
    </Motion>
  );
};

export default WalletProfileDropdown;
