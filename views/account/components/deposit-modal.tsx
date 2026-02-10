import { usePrivy } from '@privy-io/react-auth';
import { Div, P, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { toast } from 'react-hot-toast';

import { CopySVG } from '@/components/svg';

const DepositModal: FC = () => {
  const { user } = usePrivy();
  const suiWallet = user?.linkedAccounts?.find((a) => {
    if (a.type !== 'wallet' || !('address' in a)) return false;
    if ('chainType' in a && String(a.chainType).toLowerCase() === 'sui')
      return true;
    return (
      typeof a.address === 'string' &&
      a.address.startsWith('0x') &&
      a.address.length === 66
    );
  });
  const suiAddress =
    suiWallet && 'address' in suiWallet ? suiWallet.address : null;

  const solanaWallet = user?.linkedAccounts?.find((a) => {
    if (a.type !== 'wallet' || !('address' in a)) return false;
    if ('chainType' in a && String(a.chainType).toLowerCase() === 'solana')
      return true;
    return (
      typeof a.address === 'string' &&
      !a.address.startsWith('0x') &&
      a.address.length >= 32 &&
      a.address.length <= 44
    );
  });
  const solanaAddress =
    solanaWallet && 'address' in solanaWallet ? solanaWallet.address : null;

  const copyAddress = (addr: string) => {
    window.navigator.clipboard.writeText(addr);
    toast.success('Address copied');
  };

  return (
    <Div display="flex" flexDirection="column" gap="1.25rem" px="0.5rem">
      <Div
        p="1.25rem"
        bg="#FFFFFF0D"
        borderRadius="0.75rem"
        border="1px solid #FFFFFF1A"
        display="flex"
        flexDirection="column"
        gap="1rem"
      >
        <Div display="flex" alignItems="center" gap="0.75rem">
          <Div
            width="2.5rem"
            height="2.5rem"
            borderRadius="50%"
            bg="#4DA2FF1A"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="1.25rem"
          >
            S
          </Div>
          <Div>
            <P color="#FFFFFF" fontWeight="600">
              Sui Network
            </P>
            <P color="#FFFFFF80" fontSize="0.75rem">
              Send SUI tokens to your wallet address
            </P>
          </Div>
        </Div>
        {suiAddress ? (
          <>
            <Div
              display="flex"
              alignItems="center"
              gap="0.75rem"
              p="0.75rem"
              bg="#000000"
              borderRadius="0.5rem"
              border="1px solid #FFFFFF1A"
            >
              <Span
                flex="1"
                color="#FFFFFF"
                fontFamily="JetBrains Mono"
                fontSize="0.75rem"
                wordBreak="break-all"
              >
                {suiAddress}
              </Span>
              <Div
                cursor="pointer"
                onClick={() => copyAddress(suiAddress)}
                nHover={{ opacity: 0.7 }}
              >
                <CopySVG maxWidth="1rem" width="100%" />
              </Div>
            </Div>
            <P color="#FFFFFF60" fontSize="0.75rem">
              Only send Sui network assets to this address
            </P>
          </>
        ) : (
          <P color="#FFFFFF60" fontSize="0.875rem">
            No Sui wallet connected. Create one from the Account page.
          </P>
        )}
      </Div>

      <Div
        p="1.25rem"
        bg="#FFFFFF0D"
        borderRadius="0.75rem"
        border="1px solid #FFFFFF1A"
        display="flex"
        flexDirection="column"
        gap="1rem"
      >
        <Div display="flex" alignItems="center" gap="0.75rem">
          <Div
            width="2.5rem"
            height="2.5rem"
            borderRadius="50%"
            bg="#9945FF1A"
            display="flex"
            alignItems="center"
            justifyContent="center"
            fontSize="1.25rem"
          >
            S
          </Div>
          <Div>
            <P color="#FFFFFF" fontWeight="600">
              Solana Network
            </P>
            <P color="#FFFFFF80" fontSize="0.75rem">
              Fund via card, exchange, or external wallet
            </P>
          </Div>
        </Div>
        {solanaAddress ? (
          <>
            <Div
              display="flex"
              alignItems="center"
              gap="0.75rem"
              p="0.75rem"
              bg="#000000"
              borderRadius="0.5rem"
              border="1px solid #FFFFFF1A"
            >
              <Span
                flex="1"
                color="#FFFFFF"
                fontFamily="JetBrains Mono"
                fontSize="0.75rem"
                wordBreak="break-all"
              >
                {solanaAddress}
              </Span>
              <Div
                cursor="pointer"
                onClick={() => copyAddress(solanaAddress)}
                nHover={{ opacity: 0.7 }}
              >
                <CopySVG maxWidth="1rem" width="100%" />
              </Div>
            </Div>
            <P color="#FFFFFF60" fontSize="0.75rem">
              Only send Solana network assets to this address
            </P>
          </>
        ) : (
          <P color="#FFFFFF60" fontSize="0.875rem">
            No Solana wallet connected. Connect one to fund via Privy.
          </P>
        )}
      </Div>
    </Div>
  );
};

export default DepositModal;
