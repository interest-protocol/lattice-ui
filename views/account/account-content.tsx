import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, H1, H2, Img, P } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
import { type FC, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';

import { CopySVG } from '@/components/svg';
import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WORMHOLE_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
} from '@/constants';
import { ASSET_METADATA } from '@/constants/coins';
import { useModal } from '@/hooks/use-modal';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSuiBalances from '@/hooks/use-sui-balances';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';

import { DepositModal, SendModal } from './components';

const AssetRow: FC<{
  symbol: string;
  name: string;
  iconUrl?: string;
  balance: BigNumber;
  decimals: number;
  isLoading: boolean;
}> = ({ symbol, name, iconUrl, balance, decimals, isLoading }) => (
  <Div
    p="1rem"
    bg="#FFFFFF0D"
    display="flex"
    alignItems="center"
    borderRadius="0.5rem"
    nHover={{ bg: '#FFFFFF1A' }}
    justifyContent="space-between"
  >
    <Div display="flex" alignItems="center" gap="1rem">
      {iconUrl && (
        <Img
          src={iconUrl}
          alt={symbol}
          width="2.5rem"
          height="2.5rem"
          borderRadius="50%"
          objectFit="cover"
        />
      )}
      <Div>
        <P color="#FFFFFF" fontWeight="600" mb="0.25rem">
          {symbol}
        </P>
        <P color="#FFFFFF80" fontSize="0.875rem">
          {name}
        </P>
      </Div>
    </Div>
    <Div textAlign="right">
      <P color="#FFFFFF" fontFamily="JetBrains Mono" fontWeight="600">
        {isLoading
          ? '...'
          : formatMoney(FixedPointMath.toNumber(balance, decimals))}
      </P>
      <P color="#FFFFFF80" fontSize="0.875rem">
        {symbol}
      </P>
    </Div>
  </Div>
);

const AccountContent: FC = () => {
  const { setContent } = useModal();
  const { user, authenticated } = usePrivy();
  const [creatingSuiWallet, setCreatingSuiWallet] = useState(false);
  const [newSuiAddress, setNewSuiAddress] = useState<string | null>(null);

  const suiWallet = user?.linkedAccounts?.find((a) => {
    if (a.type !== 'wallet' || !('address' in a)) return false;
    if ('chainType' in a && String(a.chainType).toLowerCase() === 'sui')
      return true;
    if (
      'walletClient' in a &&
      typeof a.walletClient === 'string' &&
      a.walletClient.toLowerCase().includes('sui')
    )
      return true;
    return (
      typeof a.address === 'string' &&
      a.address.startsWith('0x') &&
      a.address.length === 66
    );
  });
  const suiAddress =
    suiWallet && 'address' in suiWallet ? suiWallet.address : null;
  const displaySuiAddress = suiAddress ?? newSuiAddress;

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

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(displaySuiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const createSuiWallet = useCallback(async () => {
    if (!user?.id) return;
    setCreatingSuiWallet(true);
    try {
      const res = await fetch('/api/wallet/create-sui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewSuiAddress(data.address);
      toast.success('Sui wallet created');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create Sui wallet'
      );
    } finally {
      setCreatingSuiWallet(false);
    }
  }, [user?.id]);

  if (!authenticated) {
    return (
      <Div
        flex="1"
        mx="auto"
        gap="1rem"
        display="flex"
        borderRadius="1rem"
        flexDirection="column"
        px={['0.5rem', '2rem']}
        width={['100%', '34rem']}
        my={['1rem', '1rem', '1rem', '1rem', '3rem']}
        justifyContent="center"
        alignItems="center"
      >
        <Div
          p="2rem"
          bg="#FFFFFF0D"
          borderRadius="1rem"
          textAlign="center"
          border="1px solid #FFFFFF1A"
          width="100%"
        >
          <H2 color="#FFFFFF" mb="1rem">
            Connect Your Wallet
          </H2>
          <P color="#FFFFFF80">
            Please connect your wallet to view your account
          </P>
        </Div>
      </Div>
    );
  }

  return (
    <Div
      flex="1"
      mx="auto"
      gap="1.5rem"
      display="flex"
      borderRadius="1rem"
      flexDirection="column"
      px={['0.5rem', '2rem']}
      width={['100%', '34rem']}
      my={['1rem', '1rem', '1rem', '1rem', '3rem']}
    >
      <Div>
        <H1 color="#FFFFFF" fontSize="2.5rem" mb="0.5rem">
          Account
        </H1>
        <P color="#FFFFFF80">Manage your wallet and view your assets</P>
      </Div>

      <Div
        p="1.5rem"
        bg="#FFFFFF0D"
        borderRadius="1rem"
        border="1px solid #FFFFFF1A"
      >
        <Div mb="1.5rem" textAlign="center">
          <P color="#FFFFFF80" fontSize="0.875rem" mb="0.5rem">
            Total Balance
          </P>
          <H2
            color="#FFFFFF"
            fontSize={['2rem', '2.5rem']}
            fontFamily="JetBrains Mono"
            mb="0.25rem"
          >
            $0.00
          </H2>
          <P color="#FFFFFF80" fontSize="0.875rem">
            USD Value
          </P>
        </Div>

        <Div display="flex" gap="1rem" mb="1.5rem" flexWrap="wrap">
          <Button
            all="unset"
            flex="1"
            minWidth="8rem"
            p="1rem"
            bg="#A78BFA"
            color="#000000"
            borderRadius="0.75rem"
            fontWeight="600"
            fontSize="1rem"
            textAlign="center"
            cursor="pointer"
            onClick={() => setContent(<DepositModal />, { title: 'Deposit' })}
            nHover={{ bg: '#C4B5FD' }}
          >
            Deposit
          </Button>
          <Button
            all="unset"
            flex="1"
            minWidth="8rem"
            p="1rem"
            bg="#FFFFFF1A"
            color="#FFFFFF"
            border="1px solid #FFFFFF1A"
            borderRadius="0.75rem"
            fontWeight="600"
            fontSize="1rem"
            textAlign="center"
            cursor="pointer"
            onClick={() => setContent(<SendModal />, { title: 'Send' })}
            nHover={{ bg: '#FFFFFF2A' }}
          >
            Send
          </Button>
        </Div>
      </Div>

      {!displaySuiAddress ? (
        <Button
          all="unset"
          width="100%"
          p="1rem"
          bg="#A78BFA1A"
          color="#A78BFA"
          borderRadius="0.5rem"
          border="1px solid #A78BFA4D"
          fontWeight="600"
          fontSize="0.875rem"
          textAlign="center"
          cursor={creatingSuiWallet ? 'wait' : 'pointer'}
          opacity={creatingSuiWallet ? '0.6' : '1'}
          onClick={createSuiWallet}
          disabled={creatingSuiWallet}
          nHover={{ bg: '#A78BFA2A' }}
        >
          {creatingSuiWallet ? 'Creating...' : 'Create Sui Wallet'}
        </Button>
      ) : (
        <Div
          p="1.5rem"
          bg="#FFFFFF0D"
          borderRadius="1rem"
          border="1px solid #FFFFFF1A"
        >
          <H2 color="#FFFFFF" fontSize="1.25rem" mb="0.5rem">
            Sui Wallet
          </H2>
          <Div
            display="flex"
            alignItems="center"
            gap="0.5rem"
            mb="1rem"
            cursor="pointer"
            onClick={() => {
              window.navigator.clipboard.writeText(displaySuiAddress);
              toast.success('Address copied');
            }}
            nHover={{ opacity: 0.7 }}
          >
            <P color="#FFFFFF80" fontSize="0.75rem" fontFamily="JetBrains Mono">
              {displaySuiAddress.slice(0, 6)}...{displaySuiAddress.slice(-4)}
            </P>
            <CopySVG maxWidth="0.875rem" width="100%" />
          </Div>
          <Div display="flex" flexDirection="column" gap="0.75rem">
            <AssetRow
              symbol="SUI"
              name={ASSET_METADATA[SUI_TYPE_ARG]?.name ?? 'Sui'}
              iconUrl={ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl}
              balance={suiBalances.sui}
              decimals={9}
              isLoading={suiLoading}
            />
            <AssetRow
              symbol={BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL'}
              name={
                BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.name ??
                'Solana (Wormhole)'
              }
              iconUrl={BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.iconUrl}
              balance={suiBalances.wsol}
              decimals={WORMHOLE_DECIMALS}
              isLoading={suiLoading}
            />
          </Div>
        </Div>
      )}

      {solanaAddress && (
        <Div
          p="1.5rem"
          bg="#FFFFFF0D"
          borderRadius="1rem"
          border="1px solid #FFFFFF1A"
        >
          <H2 color="#FFFFFF" fontSize="1.25rem" mb="0.5rem">
            Solana Wallet
          </H2>
          <Div
            display="flex"
            alignItems="center"
            gap="0.5rem"
            mb="1rem"
            cursor="pointer"
            onClick={() => {
              window.navigator.clipboard.writeText(solanaAddress);
              toast.success('Address copied');
            }}
            nHover={{ opacity: 0.7 }}
          >
            <P color="#FFFFFF80" fontSize="0.75rem" fontFamily="JetBrains Mono">
              {solanaAddress.slice(0, 4)}...{solanaAddress.slice(-4)}
            </P>
            <CopySVG maxWidth="0.875rem" width="100%" />
          </Div>
          <Div display="flex" flexDirection="column" gap="0.75rem">
            <AssetRow
              symbol="SOL"
              name="Solana"
              iconUrl={ASSET_METADATA.sol?.iconUrl}
              balance={solanaBalances.sol}
              decimals={SOL_DECIMALS}
              isLoading={solLoading}
            />
            <AssetRow
              symbol={
                BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI'
              }
              name={
                BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.name ??
                'Sui (Wormhole)'
              }
              iconUrl={BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.iconUrl}
              balance={solanaBalances.wsui}
              decimals={WORMHOLE_DECIMALS}
              isLoading={solLoading}
            />
          </Div>
        </Div>
      )}
    </Div>
  );
};

export default AccountContent;
