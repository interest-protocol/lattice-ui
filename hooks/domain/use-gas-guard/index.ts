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
  const activeChainRef = useRef<ChainKey | null>(null);
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

  const openModal = (chain: ChainKey) => {
    const address = chain === 'sui' ? suiAddress : solAddress;
    if (!address) return;

    activeChainRef.current = chain;
    const config = CHAIN_REGISTRY[chain];

    useModal.getState().setContent(
      createElement(GasRequiredModal, {
        chain,
        address,
        minAmount: config.minGasThreshold,
        onRefresh: () => handleRefresh(chain),
        refreshing,
      }),
      {
        title: `${config.nativeToken.symbol} Required`,
        allowClose: true,
      }
    );
  };

  // Open modal when gas is low
  // biome-ignore lint/correctness/useExhaustiveDependencies: openModal closes over reactive values — only trigger on readiness + balance checks
  useEffect(() => {
    if (!mounted || !isReady || dismissedRef.current) return;

    if (suiLow && suiAddress) {
      openModal('sui');
    } else if (solLow && solAddress) {
      openModal('solana');
    }
  }, [mounted, isReady, suiLow, solLow, suiAddress, solAddress]);

  // Auto-close modal when balance recovers
  useEffect(() => {
    if (!activeChainRef.current) return;

    const chain = activeChainRef.current;
    const recovered = chain === 'sui' ? !suiLow : !solLow;

    if (recovered) {
      useModal.getState().handleClose();
      activeChainRef.current = null;
    }
  }, [suiLow, solLow]);

  // Track dismiss — when modal content goes to null while we had an active chain
  useEffect(() => {
    return useModal.subscribe((state) => {
      if (activeChainRef.current && state.content === null) {
        dismissedRef.current = true;
        activeChainRef.current = null;
      }
    });
  }, []);

  // Update modal content when refreshing state changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-render modal with updated refreshing prop
  useEffect(() => {
    const chain = activeChainRef.current;
    if (!chain) return;

    const address = chain === 'sui' ? suiAddress : solAddress;
    if (!address) return;

    const config = CHAIN_REGISTRY[chain];

    useModal.getState().setContent(
      createElement(GasRequiredModal, {
        chain,
        address,
        minAmount: config.minGasThreshold,
        onRefresh: () => handleRefresh(chain),
        refreshing,
      }),
      {
        title: `${config.nativeToken.symbol} Required`,
        allowClose: true,
      }
    );
  }, [refreshing, suiAddress, solAddress]);
};

export default useGasGuard;
