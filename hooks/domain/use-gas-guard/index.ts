import { usePrivy } from '@privy-io/react-auth';
import { createElement, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import GasRequiredModal from '@/components/composed/gas-required-modal';
import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import { REGISTRATION_CACHE_KEY } from '@/constants/storage-keys';
import useBalances from '@/hooks/domain/use-balances';
import { useModal } from '@/hooks/store/use-modal';
import { parseUnits } from '@/lib/bigint-utils';

type LinkedUsers = Record<string, boolean>;

const SUI_THRESHOLD = parseUnits('1', CHAIN_REGISTRY.sui.decimals);
const SOL_THRESHOLD = parseUnits('0.01', CHAIN_REGISTRY.solana.decimals);

const useGasGuard = () => {
  const { authenticated, ready, user } = usePrivy();
  const [mounted, setMounted] = useState(false);
  const [linkedUsers] = useLocalStorage<LinkedUsers>(
    REGISTRATION_CACHE_KEY,
    {}
  );

  const {
    suiAddress,
    solanaAddress: solAddress,
    suiBalances,
    solanaBalances: solBalances,
    suiLoading,
    solLoading,
    mutateSuiBalances: mutateSui,
    mutateSolanaBalances: mutateSol,
  } = useBalances();

  const dismissedRef = useRef(false);
  const [activeChain, setActiveChain] = useState<ChainKey | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveLinkedUsers = mounted ? linkedUsers : {};
  const isLinked = user?.id ? (effectiveLinkedUsers[user.id] ?? false) : false;
  const isReady =
    ready && authenticated && isLinked && !suiLoading && !solLoading;

  const suiLow = suiBalances.sui < SUI_THRESHOLD;
  const solLow = solBalances.sol < SOL_THRESHOLD;

  const handleRefresh = async (chain: ChainKey) => {
    setRefreshing(true);
    try {
      if (chain === 'sui') {
        await mutateSui();
      } else {
        await mutateSol();
      }
    } finally {
      setRefreshing(false);
    }
  };

  // Open modal when gas is low
  useEffect(() => {
    if (!mounted || !isReady || dismissedRef.current) return;

    if (suiLow && suiAddress) {
      setActiveChain('sui');
    } else if (solLow && solAddress) {
      setActiveChain('solana');
    }
  }, [mounted, isReady, suiLow, solLow, suiAddress, solAddress]);

  // Sync modal content whenever activeChain or refreshing changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: handleRefresh reads mutable refs
  useEffect(() => {
    if (!activeChain) return;

    const address = activeChain === 'sui' ? suiAddress : solAddress;
    if (!address) return;

    const config = CHAIN_REGISTRY[activeChain];

    useModal.getState().setContent(
      createElement(GasRequiredModal, {
        chain: activeChain,
        address,
        minAmount: config.minGasThreshold,
        onRefresh: () => handleRefresh(activeChain),
        refreshing,
      }),
      {
        title: `${config.nativeToken.symbol} Required`,
        allowClose: true,
      }
    );
  }, [activeChain, refreshing, suiAddress, solAddress]);

  // Auto-close modal when balance recovers
  useEffect(() => {
    if (!activeChain) return;

    const recovered = activeChain === 'sui' ? !suiLow : !solLow;

    if (recovered) {
      useModal.getState().handleClose();
      setActiveChain(null);
    }
  }, [activeChain, suiLow, solLow]);

  // Track dismiss — when modal content goes to null while we had an active chain
  useEffect(() => {
    return useModal.subscribe((state) => {
      if (activeChain && state.content === null) {
        dismissedRef.current = true;
        setActiveChain(null);
      }
    });
  }, [activeChain]);
};

export default useGasGuard;
