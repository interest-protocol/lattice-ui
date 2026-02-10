import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { Div } from '@stylin.js/elements';
import BigNumberJS from 'bignumber.js';
import type BigNumber from 'bignumber.js';
import { type FC, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { SOL_DECIMALS, SUI_DECIMALS, XBRIDGE_DECIMALS } from '@/constants';
import { MIN_GAS_SOL, MIN_GAS_SUI } from '@/constants/alpha-limits';
import { ASSET_METADATA, SOL_TYPE } from '@/constants/coins';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useBridge, { type BridgeDirection } from '@/hooks/domain/use-bridge';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';
import { validateAlphaLimit, validateGasBalance } from '@/utils/gas-validation';

import BridgeDetails from './bridge-details';
import BridgeForm from './bridge-form';
import type {
  NetworkType,
  TokenKey,
  TokenOption,
  ValidationResult,
} from './bridge.types';

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

const Bridge: FC = () => {
  const { bridge, status, isLoading } = useBridge();
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const [sourceNetwork, setSourceNetwork] = useState<NetworkType>('solana');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SOL');
  const [amount, setAmount] = useState('');

  const destNetwork = sourceNetwork === 'sui' ? 'Solana' : 'Sui';
  const token = TOKEN_OPTIONS[selectedToken];

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const getBalance = (): BigNumber => {
    if (sourceNetwork === 'sui') {
      if (selectedToken === 'SUI') return suiBalances.sui;
      return suiBalances.wsol;
    }
    if (selectedToken === 'SOL') return solanaBalances.sol;
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

  const validation: ValidationResult = useMemo(() => {
    const amountNum = Number.parseFloat(amount) || 0;

    if (!amount || amountNum <= 0) {
      return { isDisabled: true, message: 'Enter amount' };
    }

    if (selectedToken === 'SUI' || selectedToken === 'SOL') {
      const alphaError = validateAlphaLimit(selectedToken, amountNum);
      if (alphaError) return alphaError;
    }

    if (sourceNetwork === 'sui') {
      const gasError = validateGasBalance({
        gasBalance: suiBalances.sui,
        gasDecimals: SUI_DECIMALS,
        minGas: MIN_GAS_SUI,
        amount: amountNum,
        isGasToken: selectedToken === 'SUI',
        symbol: 'SUI',
        displayDecimals: 4,
      });
      if (gasError) return gasError;
    }

    if (sourceNetwork === 'solana') {
      const gasError = validateGasBalance({
        gasBalance: solanaBalances.sol,
        gasDecimals: SOL_DECIMALS,
        minGas: MIN_GAS_SOL,
        amount: amountNum,
        isGasToken: selectedToken === 'SOL',
        symbol: 'SOL',
        displayDecimals: 6,
      });
      if (gasError) return gasError;
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
      return selectedToken === 'SUI' ? 'sui-to-wsui' : 'wsol-to-sol';
    }
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
      <BridgeForm
        sourceNetwork={sourceNetwork}
        setSourceNetwork={setSourceNetwork}
        selectedToken={selectedToken}
        setSelectedToken={setSelectedToken}
        amount={amount}
        setAmount={setAmount}
        isDisabled={isDisabled}
        isLoading={isLoading}
        status={status}
        validationMessage={validation.message}
        destNetwork={destNetwork}
        token={token}
        balanceLoading={balanceLoading}
        balanceFormatted={balanceFormatted}
        setMaxAmount={setMaxAmount}
        onBridge={handleBridge}
      />

      <BridgeDetails
        sourceNetwork={sourceNetwork}
        selectedToken={selectedToken}
        destNetwork={destNetwork}
        amount={amount}
      />
    </Div>
  );
};

export default Bridge;
