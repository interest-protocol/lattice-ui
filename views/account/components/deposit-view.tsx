import { Div, P, Span } from '@stylin.js/elements';
import { QRCodeSVG } from 'qrcode.react';
import type { FC } from 'react';

import { CopySVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';

type NetworkType = 'sui' | 'solana';

interface DepositViewProps {
  network: NetworkType;
}

const DepositView: FC<DepositViewProps> = ({ network }) => {
  const { suiAddress, solanaAddress } = useWalletAddresses();
  const address = network === 'sui' ? suiAddress : solanaAddress;
  const networkName = network === 'sui' ? 'Sui' : 'Solana';
  const networkColor = network === 'sui' ? '#4DA2FF' : '#9945FF';

  const copyAddress = () => {
    if (!address) return;
    window.navigator.clipboard.writeText(address);
    toasting.success({ action: 'Copy', message: 'Address copied' });
  };

  if (!address) {
    return (
      <Div textAlign="center" py="2rem">
        <P color="#FFFFFF80" fontSize="0.875rem">
          No {networkName} wallet connected.
          {network === 'sui'
            ? ' Create one from the Account page.'
            : ' Connect one via Privy.'}
        </P>
      </Div>
    );
  }

  return (
    <Div
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap="1.25rem"
    >
      <Div
        p="1rem"
        bg="#FFFFFF"
        borderRadius="0.75rem"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <QRCodeSVG value={address} size={160} level="H" />
      </Div>

      <Div width="100%">
        <P color="#FFFFFF80" fontSize="0.75rem" mb="0.5rem" textAlign="center">
          {networkName} Deposit Address
        </P>
        <Div
          display="flex"
          alignItems="center"
          gap="0.75rem"
          p="0.75rem"
          bg="#000000"
          borderRadius="0.5rem"
          border="1px solid #FFFFFF1A"
          cursor="pointer"
          onClick={copyAddress}
          nHover={{ bg: '#FFFFFF0D' }}
        >
          <Span
            flex="1"
            color="#FFFFFF"
            fontFamily="JetBrains Mono"
            fontSize="0.6875rem"
            wordBreak="break-all"
            textAlign="center"
          >
            {address}
          </Span>
          <Div nHover={{ opacity: 0.7 }}>
            <CopySVG maxWidth="1rem" width="100%" />
          </Div>
        </Div>
      </Div>

      <Div
        p="0.75rem"
        bg={`${networkColor}1A`}
        borderRadius="0.5rem"
        border={`1px solid ${networkColor}4D`}
        width="100%"
      >
        <P color="#FFFFFF" fontSize="0.8125rem" textAlign="center">
          Only send {networkName} network assets to this address
        </P>
      </Div>
    </Div>
  );
};

export default DepositView;
