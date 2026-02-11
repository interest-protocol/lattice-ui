import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';
import { type FC, useState } from 'react';

import CopyButton from '@/components/ui/copy-button';
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
import useBalances from '@/hooks/domain/use-balances';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { createSuiWallet as createSuiWalletApi } from '@/lib/wallet/client';
import { formatAddress, formatMoney } from '@/utils';

import { DepositView, NetworkTabs, WithdrawView } from './components';

const AssetRow: FC<{
  symbol: string;
  name: string;
  iconUrl?: string;
  balance: bigint;
  decimals: number;
  isLoading: boolean;
}> = ({ symbol, name, iconUrl, balance, decimals, isLoading }) => (
  <div className="p-4 bg-surface-light flex items-center rounded-xl hover:bg-surface-hover transition-colors duration-150 justify-between">
    <div className="flex items-center gap-4">
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt={symbol}
          width={40}
          height={40}
          className="rounded-full object-cover ring-1 ring-surface-border"
        />
      ) : null}
      <div>
        <p className="text-text font-semibold mb-1">{symbol}</p>
        <p className="text-text-secondary text-sm">{name}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-text font-mono font-semibold">
        {isLoading
          ? '...'
          : formatMoney(FixedPointMath.toNumber(balance, decimals))}
      </p>
      <p className="text-text-muted text-sm">{symbol}</p>
    </div>
  </div>
);

const BalancesView: FC<{
  displaySuiAddress: string | null;
  solanaAddress: string | null;
  suiBalances: { sui: bigint; wsol: bigint };
  solanaBalances: { sol: bigint; wsui: bigint };
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
  <div className="flex flex-col gap-6">
    {!displaySuiAddress ? (
      <button
        type="button"
        className="w-full p-4 rounded-lg font-semibold text-sm text-center border-none hover:opacity-80"
        style={{
          background: 'var(--color-accent-wash)',
          color: 'var(--color-accent)',
          border: '1px solid var(--color-accent-border)',
          cursor: creatingSuiWallet ? 'wait' : 'pointer',
          opacity: creatingSuiWallet ? 0.6 : 1,
        }}
        onClick={createSuiWallet}
        disabled={creatingSuiWallet}
      >
        {creatingSuiWallet ? 'Creating...' : 'Create Sui Wallet'}
      </button>
    ) : (
      <div
        className="p-6 rounded-2xl border border-surface-border"
        style={{
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-text text-lg font-semibold mb-2">Sui Wallet</h2>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-text-muted text-xs font-mono">
            {formatAddress(displaySuiAddress)}
          </p>
          <CopyButton
            text={displaySuiAddress}
            size="0.875rem"
            ariaLabel="Copy Sui address"
          />
        </div>
        <div className="flex flex-col gap-3">
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
        </div>
      </div>
    )}

    {solanaAddress ? (
      <div
        className="p-6 rounded-2xl border border-surface-border"
        style={{
          background: 'var(--card-bg)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <h2 className="text-text text-lg font-semibold mb-2">Solana Wallet</h2>
        <div className="flex items-center gap-2 mb-4">
          <p className="text-text-muted text-xs font-mono">
            {formatAddress(solanaAddress, 4, 4)}
          </p>
          <CopyButton
            text={solanaAddress}
            size="0.875rem"
            ariaLabel="Copy Solana address"
          />
        </div>
        <div className="flex flex-col gap-3">
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
        </div>
      </div>
    ) : null}
  </div>
);

const AccountContent: FC = () => {
  const { user, authenticated } = usePrivy();
  const { getAddress } = useWalletAddresses();
  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');
  const [creatingSuiWallet, setCreatingSuiWallet] = useState(false);
  const [newSuiAddress, setNewSuiAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [network, setNetwork] = useState<ChainKey>('solana');

  // Use newly created address if the hook doesn't have one yet
  const displaySuiAddress = suiAddress ?? newSuiAddress;

  const { suiBalances, solanaBalances, suiLoading, solLoading } = useBalances({
    suiAddress: displaySuiAddress,
  });

  const createSuiWallet = async () => {
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
  };

  if (!authenticated) {
    return (
      <div className="flex-1 mx-auto gap-4 flex rounded-2xl flex-col px-2 sm:px-8 w-full sm:w-[34rem] my-4 xl:my-12 justify-center items-center">
        <div
          className="p-8 rounded-2xl text-center border border-surface-border w-full"
          style={{
            background: 'var(--card-bg)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <h2 className="text-text mb-4">Connect Your Wallet</h2>
          <p className="text-text-secondary">
            Please connect your wallet to view your account
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto gap-6 flex rounded-2xl flex-col px-2 sm:px-8 w-full sm:w-[34rem] my-4 xl:my-12">
      <div>
        <h1 className="text-text text-[2rem] font-bold tracking-tight mb-2">
          Account
        </h1>
        <p className="text-text-secondary">Manage your wallet and assets</p>
      </div>

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
        <div
          className="p-6 rounded-2xl border border-surface-border flex flex-col gap-5"
          style={{
            background: 'var(--card-bg)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <NetworkTabs network={network} setNetwork={setNetwork} />

          {activeTab === 1 ? (
            <DepositView network={network} />
          ) : (
            <WithdrawView network={network} />
          )}
        </div>
      )}
    </div>
  );
};

export default AccountContent;
