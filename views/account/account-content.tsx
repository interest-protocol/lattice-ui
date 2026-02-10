import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, H1, H2, Img, P } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
import { type FC, useCallback, useState } from 'react';

import { CopySVG } from '@/components/ui/icons';
import Tabs from '@/components/ui/tabs';
import { toasting } from '@/components/ui/toast';
import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
  XBRIDGE_DECIMALS,
} from '@/constants';
import type { ChainKey } from '@/constants/chains';
import { ASSET_METADATA } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { createSuiWallet as createSuiWalletApi } from '@/lib/wallet/client';
import { formatAddress, formatMoney } from '@/utils';

import { DepositView, NetworkTabs, WithdrawView } from './components';

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

const BalancesView: FC<{
  displaySuiAddress: string | null;
  solanaAddress: string | null;
  suiBalances: { sui: BigNumber; wsol: BigNumber };
  solanaBalances: { sol: BigNumber; wsui: BigNumber };
  suiLoading: boolean;
  solLoading: boolean;
  creatingSuiWallet: boolean;
  createSuiWallet: () => void;
}> = ({
  displaySuiAddress,
  solanaAddress,
  suiBalances,
  solanaBalances,
  suiLoading,
  solLoading,
  creatingSuiWallet,
  createSuiWallet,
}) => (
  <Div display="flex" flexDirection="column" gap="1.5rem">
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
            toasting.success({ action: 'Copy', message: 'Address copied' });
          }}
          nHover={{ opacity: 0.7 }}
        >
          <P color="#FFFFFF80" fontSize="0.75rem" fontFamily="JetBrains Mono">
            {formatAddress(displaySuiAddress)}
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
              BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.name ?? 'Solana (Wormhole)'
            }
            iconUrl={BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.iconUrl}
            balance={suiBalances.wsol}
            decimals={XBRIDGE_DECIMALS}
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
            toasting.success({ action: 'Copy', message: 'Address copied' });
          }}
          nHover={{ opacity: 0.7 }}
        >
          <P color="#FFFFFF80" fontSize="0.75rem" fontFamily="JetBrains Mono">
            {formatAddress(solanaAddress, 4, 4)}
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
            symbol={BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI'}
            name={
              BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.name ?? 'Sui (Wormhole)'
            }
            iconUrl={BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.iconUrl}
            balance={solanaBalances.wsui}
            decimals={XBRIDGE_DECIMALS}
            isLoading={solLoading}
          />
        </Div>
      </Div>
    )}
  </Div>
);

const AccountContent: FC = () => {
  const { user, authenticated } = usePrivy();
  const { suiAddress, solanaAddress } = useWalletAddresses();
  const [creatingSuiWallet, setCreatingSuiWallet] = useState(false);
  const [newSuiAddress, setNewSuiAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [network, setNetwork] = useState<ChainKey>('solana');

  // Use newly created address if the hook doesn't have one yet
  const displaySuiAddress = suiAddress ?? newSuiAddress;

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(displaySuiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const createSuiWallet = useCallback(async () => {
    if (!user?.id) return;
    setCreatingSuiWallet(true);
    const dismiss = toasting.loading({ message: 'Creating Sui wallet...' });
    try {
      const data = await createSuiWalletApi(user.id);
      setNewSuiAddress(data.address);
      dismiss();
      toasting.success({ action: 'Wallet', message: 'Sui wallet created' });
    } catch (error) {
      dismiss();
      toasting.error({
        action: 'Wallet',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create Sui wallet',
      });
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
        <P color="#FFFFFF80">Manage your wallet and assets</P>
      </Div>

      <Tabs
        tab={activeTab}
        setTab={setActiveTab}
        tabs={['Balances', 'Deposit', 'Withdraw']}
      />

      {activeTab === 0 && (
        <BalancesView
          displaySuiAddress={displaySuiAddress}
          solanaAddress={solanaAddress}
          suiBalances={suiBalances}
          solanaBalances={solanaBalances}
          suiLoading={suiLoading}
          solLoading={solLoading}
          creatingSuiWallet={creatingSuiWallet}
          createSuiWallet={createSuiWallet}
        />
      )}

      {(activeTab === 1 || activeTab === 2) && (
        <Div
          p="1.5rem"
          bg="#FFFFFF0D"
          borderRadius="1rem"
          border="1px solid #FFFFFF1A"
          display="flex"
          flexDirection="column"
          gap="1.25rem"
        >
          <NetworkTabs network={network} setNetwork={setNetwork} />

          {activeTab === 1 ? (
            <DepositView network={network} />
          ) : (
            <WithdrawView network={network} />
          )}
        </Div>
      )}
    </Div>
  );
};

export default AccountContent;
