import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
import type BigNumber from 'bignumber.js';
import { type FC, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WORMHOLE_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
} from '@/constants';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import { ACCENT, ACCENT_HOVER } from '@/constants/colors';
import useSolanaBalances from '@/hooks/use-solana-balances';
import useSuiBalances from '@/hooks/use-sui-balances';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';

type NetworkType = 'sui' | 'solana';

interface TokenOption {
  symbol: string;
  iconUrl?: string;
  decimals: number;
}

const TOKEN_OPTIONS: Record<string, TokenOption> = {
  SUI: {
    symbol: 'SUI',
    iconUrl: ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl,
    decimals: 9,
  },
  SOL: {
    symbol: 'SOL',
    iconUrl: ASSET_METADATA[SOL_TYPE]?.iconUrl,
    decimals: SOL_DECIMALS,
  },
};

type TokenKey = 'SUI' | 'SOL';

const Bridge: FC = () => {
  const { user } = usePrivy();

  const [sourceNetwork, setSourceNetwork] = useState<NetworkType>('sui');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SUI');
  const [amount, setAmount] = useState('');
  const [bridging, setBridging] = useState(false);

  const destNetwork = sourceNetwork === 'sui' ? 'Solana' : 'Sui';
  const token = TOKEN_OPTIONS[selectedToken];

  // Find wallet addresses
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

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const getBalance = (): BigNumber => {
    if (sourceNetwork === 'sui') {
      if (selectedToken === 'SUI') return suiBalances.sui;
      // SOL on Sui = wSOL
      return suiBalances.wsol;
    }
    if (selectedToken === 'SOL') return solanaBalances.sol;
    // SUI on Solana = wSUI
    return solanaBalances.wsui;
  };

  const getDecimals = (): number => {
    if (sourceNetwork === 'sui') {
      return selectedToken === 'SUI' ? 9 : WORMHOLE_DECIMALS;
    }
    return selectedToken === 'SOL' ? SOL_DECIMALS : WORMHOLE_DECIMALS;
  };

  const isLoading = sourceNetwork === 'sui' ? suiLoading : solLoading;
  const balance = getBalance();
  const decimals = getDecimals();
  const balanceFormatted = formatMoney(
    FixedPointMath.toNumber(balance, decimals)
  );

  const setMaxAmount = () => {
    setAmount(FixedPointMath.toNumber(balance, decimals).toString());
  };

  const isDisabled = bridging || !amount || Number.parseFloat(amount) <= 0;

  const handleBridge = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Enter an amount');
      return;
    }

    setBridging(true);
    try {
      // TODO: Implement Wormhole bridge integration
      toast('Bridge integration coming soon');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bridge failed');
    } finally {
      setBridging(false);
    }
  };

  return (
    <Div
      display="flex"
      flexDirection="column"
      gap="1.5rem"
      width="100%"
      maxWidth="40rem"
      mx="auto"
    >
      <Div
        display="flex"
        flexDirection="column"
        gap="1rem"
        p="1.5rem"
        bg="#FFFFFF0D"
        borderRadius="1rem"
      >
        {/* Source Network */}
        <Div>
          <Label
            color="#FFFFFF80"
            fontSize="0.875rem"
            mb="0.5rem"
            display="block"
          >
            From Network
          </Label>
          <Div display="flex" gap="0.5rem">
            {(['sui', 'solana'] as const).map((net) => {
              const isSelected = net === sourceNetwork;
              return (
                <Button
                  key={net}
                  all="unset"
                  flex="1"
                  p="0.75rem"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap="0.5rem"
                  cursor="pointer"
                  borderRadius="0.5rem"
                  border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
                  bg={isSelected ? '#A78BFA1A' : '#FFFFFF0D'}
                  onClick={() => setSourceNetwork(net)}
                  nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
                >
                  {net === 'sui' && ASSET_METADATA[SUI_TYPE_ARG]?.iconUrl && (
                    <img
                      src={ASSET_METADATA[SUI_TYPE_ARG].iconUrl}
                      alt="Sui"
                      width="20"
                      height="20"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  {net === 'solana' && ASSET_METADATA[SOL_TYPE]?.iconUrl && (
                    <img
                      src={ASSET_METADATA[SOL_TYPE].iconUrl}
                      alt="Solana"
                      width="20"
                      height="20"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  <Span color="#FFFFFF" fontWeight="600">
                    {net === 'sui' ? 'Sui' : 'Solana'}
                  </Span>
                </Button>
              );
            })}
          </Div>
        </Div>

        {/* Destination indicator */}
        <Div display="flex" justifyContent="center" alignItems="center">
          <Div
            px="1rem"
            py="0.25rem"
            borderRadius="1rem"
            bg="#FFFFFF0D"
            color="#FFFFFF80"
            fontSize="0.75rem"
          >
            → To {destNetwork}
          </Div>
        </Div>

        {/* Token */}
        <Div>
          <Label
            color="#FFFFFF80"
            fontSize="0.875rem"
            mb="0.5rem"
            display="block"
          >
            Token
          </Label>
          <Div display="flex" gap="0.5rem">
            {(['SUI', 'SOL'] as const).map((tk) => {
              const opt = TOKEN_OPTIONS[tk];
              const isSelected = tk === selectedToken;
              return (
                <Button
                  key={tk}
                  all="unset"
                  flex="1"
                  p="0.75rem"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  gap="0.5rem"
                  cursor="pointer"
                  borderRadius="0.5rem"
                  border={`1px solid ${isSelected ? '#A78BFA' : '#FFFFFF1A'}`}
                  bg={isSelected ? '#A78BFA1A' : '#FFFFFF0D'}
                  onClick={() => setSelectedToken(tk)}
                  nHover={{ bg: isSelected ? '#A78BFA1A' : '#FFFFFF1A' }}
                >
                  {opt.iconUrl && (
                    <img
                      src={opt.iconUrl}
                      alt={opt.symbol}
                      width="20"
                      height="20"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                  <Span color="#FFFFFF" fontWeight="600">
                    {opt.symbol}
                  </Span>
                </Button>
              );
            })}
          </Div>
        </Div>

        {/* Amount */}
        <Div>
          <Div display="flex" justifyContent="space-between" mb="0.5rem">
            <Label color="#FFFFFF80" fontSize="0.875rem">
              Amount
            </Label>
            <Button
              all="unset"
              cursor="pointer"
              display="flex"
              gap="0.25rem"
              nHover={{ color: '#A78BFA' }}
              onClick={setMaxAmount}
            >
              <Span color="#FFFFFF80" fontSize="0.875rem">
                Balance:{' '}
                {isLoading ? '...' : `${balanceFormatted} ${token.symbol}`}
              </Span>
            </Button>
          </Div>
          <Div
            p="1rem"
            bg="#FFFFFF0D"
            borderRadius="0.75rem"
            border="1px solid #FFFFFF1A"
            display="flex"
            alignItems="center"
          >
            <Input
              all="unset"
              flex="1"
              color="#FFFFFF"
              fontFamily="JetBrains Mono"
              fontSize="1.5rem"
              placeholder="0"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <Span color="#FFFFFF80" fontSize="0.875rem" fontWeight="600">
              {token.symbol}
            </Span>
          </Div>
        </Div>

        {/* Bridge Button */}
        <Button
          all="unset"
          width="100%"
          py="1rem"
          px="1.5rem"
          bg={ACCENT}
          color="white"
          fontSize="1rem"
          fontWeight="600"
          borderRadius="0.75rem"
          border="none"
          textAlign="center"
          cursor={isDisabled ? 'not-allowed' : 'pointer'}
          opacity={isDisabled ? 0.5 : 1}
          nHover={!isDisabled ? { bg: ACCENT_HOVER } : {}}
          onClick={handleBridge}
          disabled={isDisabled}
        >
          {bridging
            ? 'Bridging...'
            : isDisabled
              ? 'Enter amount'
              : `Bridge ${token.symbol} to ${destNetwork}`}
        </Button>
      </Div>

      {/* Details */}
      <Div
        p="1.5rem"
        bg="#FFFFFF0D"
        borderRadius="1rem"
        display="flex"
        flexDirection="column"
        gap="1rem"
      >
        <Div display="flex" justifyContent="space-between" alignItems="center">
          <Span fontSize="0.875rem" color="#FFFFFF80">
            Route
          </Span>
          <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
            {sourceNetwork === 'sui' ? 'Sui' : 'Solana'} → {destNetwork}
          </Span>
        </Div>
        <Div display="flex" justifyContent="space-between" alignItems="center">
          <Span fontSize="0.875rem" color="#FFFFFF80">
            You receive
          </Span>
          <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
            {amount || '0'}{' '}
            {sourceNetwork === 'sui'
              ? selectedToken === 'SUI'
                ? (BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI')
                : (BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL')
              : selectedToken === 'SOL'
                ? (BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL')
                : (BRIDGED_ASSET_METADATA[WSUI_SOLANA_MINT]?.symbol ?? 'wSUI')}
          </Span>
        </Div>
        <Div display="flex" justifyContent="space-between" alignItems="center">
          <Span fontSize="0.875rem" color="#FFFFFF80">
            Bridge Fee
          </Span>
          <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
            --
          </Span>
        </Div>
        <Div display="flex" justifyContent="space-between" alignItems="center">
          <Span fontSize="0.875rem" color="#FFFFFF80">
            Estimated Time
          </Span>
          <Span fontSize="0.875rem" fontWeight="500" color="#FFFFFF">
            ~2-5 minutes
          </Span>
        </Div>
      </Div>

      {/* Info */}
      <P color="#FFFFFF40" fontSize="0.75rem" textAlign="center">
        Powered by Wormhole. Assets are bridged as wrapped tokens.
      </P>
    </Div>
  );
};

export default Bridge;
