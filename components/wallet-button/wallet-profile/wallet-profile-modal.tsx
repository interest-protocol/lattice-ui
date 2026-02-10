import { Div, Span } from '@stylin.js/elements';
import type { FC } from 'react';

import { CopySVG, LogoutSVG } from '@/components/svg';
import { toasting } from '@/components/toast';

interface WalletProfileModalProps {
  displayAddress: string;
  fullAddress: string;
  onLogout: () => void;
  onClose: () => void;
}

const WalletProfileModal: FC<WalletProfileModalProps> = ({
  displayAddress,
  fullAddress,
  onLogout,
  onClose,
}) => {
  const copyAddress = () => {
    if (fullAddress) {
      window.navigator.clipboard.writeText(fullAddress);
      toasting.success({ action: 'Copy', message: 'Address copied' });
    }
  };

  return (
    <Div display="flex" flexDirection="column" gap="0.75rem">
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
        borderRadius="0.5rem"
        border="1px solid #FFFFFF33"
        onClick={() => {
          onLogout();
          onClose();
        }}
        nHover={{ opacity: 0.9 }}
      >
        <Span>Disconnect</Span>
        <LogoutSVG width="100%" maxWidth="1rem" maxHeight="1rem" />
      </Div>
    </Div>
  );
};

export default WalletProfileModal;
