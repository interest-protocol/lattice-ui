import { type FC, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { XBRIDGE_DECIMALS } from '@/constants';
import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useBridge, { type BridgeDirection } from '@/hooks/domain/use-bridge';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { parseUnits } from '@/lib/bigint-utils';
import { Token } from '@/lib/entities';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';
import { validateAlphaLimit, validateGasBalance } from '@/utils/gas-validation';
import type { TokenKey, TokenOption, ValidationResult } from './bridge.types';
import BridgeDetails from './bridge-details';
import BridgeForm from './bridge-form';

const TOKEN_OPTIONS: Record<string, TokenOption> = {
  SUI: {
    symbol: Token.SUI.symbol,
    iconUrl: Token.SUI.iconUrl,
    decimals: Token.SUI.decimals,
  },
  SOL: {
    symbol: Token.SOL.symbol,
    iconUrl: Token.SOL.iconUrl,
    decimals: Token.SOL.decimals,
  },
};

const OPPOSITE_CHAIN: Record<ChainKey, ChainKey> = {
  sui: 'solana',
  solana: 'sui',
};

const Bridge: FC = () => {
  const { bridge, status, isLoading } = useBridge();
  const { suiAddress, solanaAddress } = useWalletAddresses();

  const [sourceNetwork, setSourceNetwork] = useState<ChainKey>('solana');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('SOL');
  const [amount, setAmount] = useState('');

  const destNetwork = CHAIN_REGISTRY[OPPOSITE_CHAIN[sourceNetwork]].displayName;
  const token = TOKEN_OPTIONS[selectedToken];
  const sourceConfig = CHAIN_REGISTRY[sourceNetwork];

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const getBalance = (): bigint => {
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
    return selectedToken === 'SOL' ? Token.SOL.decimals : XBRIDGE_DECIMALS;
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

    const gasBalance =
      sourceNetwork === 'sui' ? suiBalances.sui : solanaBalances.sol;
    const gasError = validateGasBalance({
      gasBalance,
      gasDecimals: sourceConfig.decimals,
      minGas: sourceConfig.minGas,
      amount: amountNum,
      isGasToken:
        sourceNetwork === 'sui'
          ? selectedToken === 'SUI'
          : selectedToken === 'SOL',
      symbol: sourceConfig.nativeToken.symbol,
      displayDecimals: sourceConfig.displayPrecision,
    });
    if (gasError) return gasError;

    return { isDisabled: false, message: null };
  }, [
    amount,
    selectedToken,
    sourceNetwork,
    sourceConfig,
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
    const amountRaw = parseUnits(amount, decimals);

    await bridge({ direction, amount: amountRaw });

    if (status === 'success') {
      setAmount('');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[40rem] mx-auto">
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
    </div>
  );
};

export default Bridge;
