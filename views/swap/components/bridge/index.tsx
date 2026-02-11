'use client';

import { type FC, useState } from 'react';

import { CHAIN_REGISTRY } from '@/constants/chains';
import useSolanaBalances from '@/hooks/blockchain/use-solana-balances';
import useSuiBalances from '@/hooks/blockchain/use-sui-balances';
import useBridge from '@/hooks/domain/use-bridge';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useModal } from '@/hooks/store/use-modal';
import { parseUnits } from '@/lib/bigint-utils';
import { validateAlphaLimit, validateGasBalance } from '@/utils/gas-validation';

import {
  BRIDGE_ROUTES,
  type BridgeRoute,
  type ValidationResult,
} from './bridge.types';
import BridgeDetailsInline from './bridge-details-inline';
import BridgeFromCard from './bridge-from-card';
import BridgeProgressStepper from './bridge-progress-stepper';
import BridgeRouteSelector from './bridge-route-selector';
import BridgeToCard from './bridge-to-card';

const REVERSE_ROUTE_KEY: Record<string, string> = {
  'sol-to-wsol': 'wsol-to-sol',
  'wsol-to-sol': 'sol-to-wsol',
  'sui-to-wsui': 'wsui-to-sui',
  'wsui-to-sui': 'sui-to-wsui',
};

const Bridge: FC = () => {
  const { bridge, status, isLoading, reset } = useBridge();
  const { getAddress } = useWalletAddresses();
  const setContent = useModal((s) => s.setContent);
  const handleClose = useModal((s) => s.handleClose);

  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');

  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute>(
    BRIDGE_ROUTES[0] as BridgeRoute
  );
  const [amount, setAmount] = useState('');

  const { balances: suiBalances, isLoading: suiLoading } =
    useSuiBalances(suiAddress);
  const { balances: solanaBalances, isLoading: solLoading } =
    useSolanaBalances(solanaAddress);

  const routeBalances: Record<string, bigint> = {
    'sol-to-wsol': solanaBalances.sol,
    'wsol-to-sol': suiBalances.wsol,
    'sui-to-wsui': suiBalances.sui,
    'wsui-to-sui': solanaBalances.wsui,
  };

  const balanceLoading =
    selectedRoute.sourceChain === 'sui' ? suiLoading : solLoading;
  const balance = routeBalances[selectedRoute.key] ?? 0n;

  const sourceConfig = CHAIN_REGISTRY[selectedRoute.sourceChain];

  const validation: ValidationResult = (() => {
    const amountNum = Number.parseFloat(amount) || 0;

    if (!amount || amountNum <= 0) {
      return { isDisabled: true, message: 'Enter amount' };
    }

    const symbol = selectedRoute.sourceToken.symbol;
    if (symbol === 'SUI' || symbol === 'SOL') {
      const alphaError = validateAlphaLimit(symbol, amountNum);
      if (alphaError) return alphaError;
    }

    const gasBalance =
      selectedRoute.sourceChain === 'sui'
        ? suiBalances.sui
        : solanaBalances.sol;
    const isGasToken =
      selectedRoute.sourceToken.symbol === sourceConfig.nativeToken.symbol;

    const gasError = validateGasBalance({
      gasBalance,
      gasDecimals: sourceConfig.decimals,
      minGas: sourceConfig.minGas,
      amount: amountNum,
      isGasToken,
      symbol: sourceConfig.nativeToken.symbol,
      displayDecimals: sourceConfig.displayPrecision,
    });
    if (gasError) return gasError;

    return { isDisabled: false, message: null };
  })();

  const isDisabled = isLoading || validation.isDisabled;

  const handleBridge = async () => {
    const amountRaw = parseUnits(amount, selectedRoute.sourceToken.decimals);
    const success = await bridge({
      direction: selectedRoute.key,
      amount: amountRaw,
    });
    if (success) {
      setAmount('');
    }
  };

  const handleRetry = () => {
    reset();
  };

  const handleSelectRoute = (route: BridgeRoute) => {
    setSelectedRoute(route);
    setAmount('');
    handleClose();
  };

  const openRouteSelector = () => {
    setContent(
      <BridgeRouteSelector
        routes={BRIDGE_ROUTES}
        selectedRoute={selectedRoute}
        routeBalances={routeBalances}
        onSelect={handleSelectRoute}
      />,
      { title: 'Select Bridge Route' }
    );
  };

  const handleFlip = () => {
    const reverseKey = REVERSE_ROUTE_KEY[selectedRoute.key];
    const reverseRoute = BRIDGE_ROUTES.find((r) => r.key === reverseKey);
    if (reverseRoute) setSelectedRoute(reverseRoute);
  };

  const destChainName = CHAIN_REGISTRY[selectedRoute.destChain].displayName;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[40rem] mx-auto">
      <BridgeFromCard
        route={selectedRoute}
        amount={amount}
        setAmount={setAmount}
        balance={balance}
        balanceLoading={balanceLoading}
        onOpenRouteSelector={openRouteSelector}
      />

      <div className="flex items-center justify-center -my-1 relative z-10">
        <button
          type="button"
          className="flex justify-center items-center cursor-pointer bg-transparent border-none p-0"
          onClick={handleFlip}
        >
          <div className="w-10 h-10 rounded-full bg-surface-lighter flex justify-center items-center hover:bg-surface-hover border border-surface-border">
            <span className="text-text-muted text-lg">&#x2193;</span>
          </div>
        </button>
      </div>

      <BridgeToCard route={selectedRoute} amount={amount} />

      <BridgeDetailsInline route={selectedRoute} amount={amount} />

      {isLoading || status === 'success' || status === 'error' ? (
        <BridgeProgressStepper status={status} onRetry={handleRetry} />
      ) : (
        <button
          type="button"
          className="w-full py-4 px-6 bg-accent text-white text-base font-semibold rounded-xl border-none hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          onClick={handleBridge}
          disabled={isDisabled}
        >
          {validation.message
            ? validation.message
            : `Bridge ${selectedRoute.sourceToken.symbol} to ${destChainName}`}
        </button>
      )}

      <p className="text-text-dimmed text-xs text-center">
        Powered by XBridge. Assets are bridged as wrapped tokens.
      </p>
    </div>
  );
};

export default Bridge;
