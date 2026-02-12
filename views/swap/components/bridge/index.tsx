'use client';

import { motion } from 'motion/react';
import { type FC, useState } from 'react';
import FlipButton from '@/components/composed/flip-button';
import { CHAIN_REGISTRY } from '@/constants/chains';
import useBalances from '@/hooks/domain/use-balances';
import useBridge from '@/hooks/domain/use-bridge';
import useNonceAccount from '@/hooks/domain/use-nonce-account';
import { useModal } from '@/hooks/store/use-modal';
import { parseUnits } from '@/lib/bigint-utils';

import { BRIDGE_ROUTES, type BridgeRoute } from './bridge.types';
import BridgeDetailsInline from './bridge-details-inline';
import BridgeFromCard from './bridge-from-card';
import BridgeProgressStepper from './bridge-progress-stepper';
import BridgeRouteSelector from './bridge-route-selector';
import BridgeToCard from './bridge-to-card';
import useBridgeValidation from './use-bridge-validation';
import useNonceModal from './use-nonce-modal';

const CARD_STYLE = {
  background: 'var(--swap-card-bg)',
  boxShadow: 'var(--swap-card-shadow)',
  border: '1px solid var(--swap-card-border)',
  backdropFilter: 'blur(24px) saturate(1.5)',
} as const;

const CARD_SPRING = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  delay: 0.05,
};

const REVERSE_ROUTE_KEY: Record<string, string> = {
  'sol-to-wsol': 'wsol-to-sol',
  'wsol-to-sol': 'sol-to-wsol',
  'sui-to-wsui': 'wsui-to-sui',
  'wsui-to-sui': 'sui-to-wsui',
};

// Estimated rent (80 bytes) + tx fee — precise check happens server-side
const NONCE_REQUIRED_LAMPORTS = 1_452_680n;

const Bridge: FC = () => {
  const { bridge, status, isLoading, reset } = useBridge();
  const {
    suiBalances,
    solanaBalances,
    solanaAddress,
    suiLoading,
    solLoading,
    mutateSolanaBalances,
  } = useBalances();
  const setContent = useModal((s) => s.setContent);
  const handleClose = useModal((s) => s.handleClose);
  const nonce = useNonceAccount();

  const [selectedRoute, setSelectedRoute] = useState<BridgeRoute>(
    BRIDGE_ROUTES[0] as BridgeRoute
  );
  const [amount, setAmount] = useState('');

  const { openNonceModal } = useNonceModal({
    solanaAddress,
    solBalance: solanaBalances.sol,
    requiredLamports: NONCE_REQUIRED_LAMPORTS,
    nonce,
    mutateSolanaBalances,
    solLoading,
  });

  const routeBalances: Record<string, bigint> = {
    'sol-to-wsol': solanaBalances.sol,
    'wsol-to-sol': suiBalances.wsol,
    'sui-to-wsui': suiBalances.sui,
    'wsui-to-sui': solanaBalances.wsui,
  };

  const balanceLoading =
    selectedRoute.sourceChain === 'sui' ? suiLoading : solLoading;
  const balance = routeBalances[selectedRoute.key] ?? 0n;

  const validation = useBridgeValidation({
    route: selectedRoute,
    amount,
    suiBalances,
    solanaBalances,
  });

  const isDisabled = isLoading || validation.isDisabled;
  const isReady = !isDisabled && !isLoading;

  const handleBridge = async () => {
    if (!selectedRoute.enabled) return;

    if (!nonce.hasNonce) {
      openNonceModal();
      return;
    }

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
    if (reverseRoute) {
      setSelectedRoute(reverseRoute);
      setAmount('');
    }
  };

  const destChainName = CHAIN_REGISTRY[selectedRoute.destChain].displayName;

  return (
    <div className="flex flex-col gap-3 w-full max-w-[28rem] mx-auto">
      <motion.div
        className="flex flex-col rounded-3xl relative"
        style={CARD_STYLE}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={CARD_SPRING}
      >
        <div className="p-5 pb-4">
          <BridgeFromCard
            route={selectedRoute}
            amount={amount}
            setAmount={setAmount}
            balance={balance}
            balanceLoading={balanceLoading}
            onOpenRouteSelector={openRouteSelector}
          />
        </div>

        <FlipButton ariaLabel="Reverse bridge direction" onClick={handleFlip} />

        <div className="p-5 pt-4">
          <BridgeToCard route={selectedRoute} amount={amount} />
        </div>

        <div className="px-5">
          <BridgeDetailsInline route={selectedRoute} amount={amount} />
        </div>

        <div className="px-5 pb-5 pt-3">
          {isLoading || status === 'success' || status === 'error' ? (
            <BridgeProgressStepper status={status} onRetry={handleRetry} />
          ) : (
            <motion.button
              type="button"
              className={`w-full py-[18px] px-6 text-white text-base font-semibold rounded-2xl border-none transition-colors duration-200 disabled:cursor-not-allowed cursor-pointer focus-ring ${isReady ? 'cta-ready-pulse' : ''}`}
              style={{
                opacity: isDisabled ? 0.4 : 1,
                background: 'var(--btn-primary-bg)',
                boxShadow: isReady ? 'var(--cta-idle-glow)' : 'none',
              }}
              whileHover={
                isDisabled
                  ? undefined
                  : { y: -3, scale: 1.01, boxShadow: 'var(--cta-hover-glow)' }
              }
              whileTap={isDisabled ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleBridge}
              disabled={isDisabled}
            >
              {validation.message
                ? validation.message
                : `Bridge ${selectedRoute.sourceToken.symbol} to ${destChainName}`}
            </motion.button>
          )}
        </div>
      </motion.div>

      <p className="text-text-dimmed text-xs text-center">
        Powered by XBridge. Assets are bridged as wrapped tokens.
      </p>
    </div>
  );
};

export default Bridge;
