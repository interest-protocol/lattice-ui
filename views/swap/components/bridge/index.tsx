import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { usePrivy } from '@privy-io/react-auth';
import { Button, Div, Input, Label, P, Span } from '@stylin.js/elements';
import BigNumberJS from 'bignumber.js';
import type BigNumber from 'bignumber.js';
import { type FC, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import {
  BRIDGED_ASSET_METADATA,
  SOL_DECIMALS,
  WSOL_SUI_TYPE,
  WSUI_SOLANA_MINT,
  XBRIDGE_DECIMALS,
} from '@/constants';
import {
  ALPHA_MAX_SOL,
  ALPHA_MAX_SUI,
  MIN_GAS_SOL,
  MIN_GAS_SUI,
} from '@/constants/alpha-limits';
import useBridge, { type BridgeDirection, type BridgeStatus } from '@/hooks/use-bridge';

const SUI_DECIMALS = 9;
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

const STATUS_LABELS: Record<BridgeStatus, string> = {
  idle: '',
  depositing: 'Depositing...',
  creating: 'Creating request...',
  voting: 'Verifying...',
  executing: 'Executing...',
  waiting: 'Confirming...',
  success: 'Bridge completed!',
  error: 'Bridge failed',
};

const Bridge: FC = () => {
  const { user } = usePrivy();
  const { bridge, reset, status, isLoading, error } = useBridge();

  const [sourceNetwork, setSourceNetwork] = useState<NetworkType>('solana');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SOL');
  const [amount, setAmount] = useState('');

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
      return selectedToken === 'SUI' ? 9 : XBRIDGE_DECIMALS;
    }
    return selectedToken === 'SOL' ? SOL_DECIMALS : XBRIDGE_DECIMALS;
  };

  const balanceLoading = sourceNetwork === 'sui' ? suiLoading : solLoading;
  const balance = getBalance();
  const decimals = getDecimals();
  const balanceFormatted = formatMoney(
    FixedPointMath.toNumber(balance, decimals)
  );

  const setMaxAmount = () => {
    setAmount(FixedPointMath.toNumber(balance, decimals).toString());
  };

  // Validation for alpha limits and gas
  const validation = useMemo(() => {
    const amountNum = Number.parseFloat(amount) || 0;

    // No amount entered
    if (!amount || amountNum <= 0) {
      return { isDisabled: true, message: 'Enter amount' };
    }

    // Check alpha limits based on selected token
    if (selectedToken === 'SUI' && amountNum > ALPHA_MAX_SUI) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SUI} SUI (alpha limit)`,
      };
    }
    if (selectedToken === 'SOL' && amountNum > ALPHA_MAX_SOL) {
      return {
        isDisabled: true,
        message: `Max ${ALPHA_MAX_SOL} SOL (alpha limit)`,
      };
    }

    // Check gas balance based on source network
    if (sourceNetwork === 'sui') {
      const gasNeeded = new BigNumberJS(MIN_GAS_SUI).times(10 ** SUI_DECIMALS);
      // If bridging SUI, need amount + gas; if bridging wSOL, just need gas
      const amountNeeded =
        selectedToken === 'SUI'
          ? new BigNumberJS(amountNum).times(10 ** SUI_DECIMALS)
          : new BigNumberJS(0);
      const totalNeeded = gasNeeded.plus(amountNeeded);

      if (suiBalances.sui.lt(totalNeeded)) {
        const suiBalance = FixedPointMath.toNumber(
          suiBalances.sui,
          SUI_DECIMALS
        );
        if (selectedToken === 'SUI') {
          return {
            isDisabled: true,
            message: `Insufficient SUI (need ${amountNum} + ~${MIN_GAS_SUI} gas, have ${suiBalance.toFixed(4)})`,
          };
        }
        return {
          isDisabled: true,
          message: `Insufficient SUI for gas (need ~${MIN_GAS_SUI}, have ${suiBalance.toFixed(4)})`,
        };
      }
    }

    if (sourceNetwork === 'solana') {
      const gasNeeded = new BigNumberJS(MIN_GAS_SOL).times(10 ** SOL_DECIMALS);
      // If bridging SOL, need amount + gas; if bridging wSUI, just need gas
      const amountNeeded =
        selectedToken === 'SOL'
          ? new BigNumberJS(amountNum).times(10 ** SOL_DECIMALS)
          : new BigNumberJS(0);
      const totalNeeded = gasNeeded.plus(amountNeeded);

      if (solanaBalances.sol.lt(totalNeeded)) {
        const solBalance = FixedPointMath.toNumber(
          solanaBalances.sol,
          SOL_DECIMALS
        );
        if (selectedToken === 'SOL') {
          return {
            isDisabled: true,
            message: `Insufficient SOL (need ${amountNum} + ~${MIN_GAS_SOL} gas, have ${solBalance.toFixed(6)})`,
          };
        }
        return {
          isDisabled: true,
          message: `Insufficient SOL for gas (need ~${MIN_GAS_SOL}, have ${solBalance.toFixed(6)})`,
        };
      }
    }

    return { isDisabled: false, message: null };
  }, [
    amount,
    selectedToken,
    sourceNetwork,
    suiBalances.sui,
    solanaBalances.sol,
  ]);

  const isDisabled = isLoading || validation.isDisabled;

  const getBridgeDirection = (): BridgeDirection => {
    if (sourceNetwork === 'sui') {
      // From Sui: SUI → wSUI (on Solana), or wSOL → SOL (on Solana)
      return selectedToken === 'SUI' ? 'sui-to-wsui' : 'wsol-to-sol';
    }
    // From Solana: SOL → wSOL (on Sui), or wSUI → SUI (on Sui)
    return selectedToken === 'SOL' ? 'sol-to-wsol' : 'wsui-to-sui';
  };

  const handleBridge = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Enter an amount');
      return;
    }

    const direction = getBridgeDirection();
    const amountBN = new BigNumberJS(amount).times(10 ** decimals);

    await bridge({ direction, amount: amountBN });

    if (status === 'success') {
      setAmount('');
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
                {balanceLoading ? '...' : `${balanceFormatted} ${token.symbol}`}
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
          {isLoading
            ? STATUS_LABELS[status]
            : validation.message
              ? validation.message
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
                : 'SOL'
              : selectedToken === 'SOL'
                ? (BRIDGED_ASSET_METADATA[WSOL_SUI_TYPE]?.symbol ?? 'wSOL')
                : 'SUI'}
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
        Powered by XBridge. Assets are bridged as wrapped tokens.
      </P>
    </Div>
  );
};

export default Bridge;
