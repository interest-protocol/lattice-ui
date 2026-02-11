import { usePrivy, useUser } from '@privy-io/react-auth';
import { createElement, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import GasRequiredModal from '@/components/composed/gas-required-modal';
import { toasting } from '@/components/ui/toast';
import {
  WALLETS_LINKED_KEY,
  WALLETS_REGISTERED_KEY,
} from '@/constants/storage-keys';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useModal } from '@/hooks/store/use-modal';
import { ApiRequestError } from '@/lib/api/client';
import {
  createSolanaWallet,
  createSuiWallet,
  linkSolanaWallet,
} from '@/lib/wallet/client';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2000, 5000, 10000];

type RegisteredUsers = Record<string, boolean>;
type LinkedUsers = Record<string, boolean>;

const useWalletRegistration = () => {
  const { user, authenticated, ready } = usePrivy();
  const { refreshUser } = useUser();
  const { hasWallet, getAddress } = useWalletAddresses();
  const hasSuiWallet = hasWallet('sui');
  const hasSolanaWallet = hasWallet('solana');
  const [mounted, setMounted] = useState(false);
  const [registeredUsers, setRegisteredUsers] =
    useLocalStorage<RegisteredUsers>(WALLETS_REGISTERED_KEY, {});
  const [linkedUsers, setLinkedUsers] = useLocalStorage<LinkedUsers>(
    WALLETS_LINKED_KEY,
    {}
  );
  const isRegistering = useRef(false);
  const isLinking = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const createdSuiAddressRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      clearTimeout(retryTimerRef.current);
    };
  }, []);

  const effectiveRegisteredUsers = mounted ? registeredUsers : {};
  const effectiveLinkedUsers = mounted ? linkedUsers : {};

  const registerWallets = async (retryCount = 0) => {
    if (!user?.id || isRegistering.current) return;
    if (effectiveRegisteredUsers[user.id]) return;

    isRegistering.current = true;
    const WALLET_SETUP_TOAST_ID = 'wallet-setup';

    try {
      const needsSui = !hasSuiWallet;
      const needsSolana = !hasSolanaWallet;

      if (needsSui || needsSolana) {
        const message =
          retryCount > 0
            ? 'Retrying wallet setup...'
            : 'Setting up your wallets...';
        toasting.loadingWithId({ message }, WALLET_SETUP_TOAST_ID);

        const [suiResult] = await Promise.all([
          needsSui ? createSuiWallet(user.id) : null,
          needsSolana ? createSolanaWallet(user.id) : null,
        ]);

        if (suiResult) {
          createdSuiAddressRef.current = suiResult.address;
        }

        try {
          await refreshUser();
        } catch {
          // Refresh failure is non-fatal — linking effect will still
          // trigger once Privy eventually syncs on its own.
        }

        toasting.dismiss(WALLET_SETUP_TOAST_ID);
        toasting.success({
          action: 'Wallet Setup',
          message: 'Your wallets are ready',
        });
      }

      setRegisteredUsers((prev) => ({ ...prev, [user.id]: true }));
    } catch (_error) {
      toasting.dismiss(WALLET_SETUP_TOAST_ID);
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[retryCount];
        isRegistering.current = false;
        retryTimerRef.current = setTimeout(
          () => registerWallets(retryCount + 1),
          delay
        );
        return;
      }

      toasting.error({
        action: 'Wallet Setup',
        message: 'Please refresh the page',
      });
    } finally {
      isRegistering.current = false;
    }
  };

  const openGasModal = (suiAddress: string) => {
    useModal.getState().setContent(
      createElement(GasRequiredModal, {
        suiAddress,
        onRetry: () => linkWallets(0),
      }),
      { title: 'SUI Gas Required', allowClose: false }
    );
  };

  const linkWallets = async (retryCount = 0) => {
    if (!user?.id || isLinking.current) return;
    if (effectiveLinkedUsers[user.id]) return;
    if (!hasSuiWallet || !hasSolanaWallet) return;

    isLinking.current = true;

    try {
      await linkSolanaWallet(user.id);
      setLinkedUsers((prev) => ({ ...prev, [user.id]: true }));
      useModal.getState().handleClose();
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === 'INSUFFICIENT_GAS'
      ) {
        const suiAddress = getAddress('sui') || createdSuiAddressRef.current;
        if (suiAddress) {
          isLinking.current = false;
          openGasModal(suiAddress);
          return;
        }
      }

      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[retryCount];
        isLinking.current = false;
        retryTimerRef.current = setTimeout(
          () => linkWallets(retryCount + 1),
          delay
        );
        return;
      }

      toasting.error({
        action: 'Wallet Link',
        message: 'Please refresh the page',
      });
    } finally {
      isLinking.current = false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: registerWallets closes over deps already listed — React Compiler ensures stable reference
  useEffect(() => {
    if (!mounted) return;

    if (
      ready &&
      authenticated &&
      user?.id &&
      !effectiveRegisteredUsers[user.id]
    ) {
      registerWallets();
    }
  }, [mounted, ready, authenticated, user?.id, effectiveRegisteredUsers]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: linkWallets closes over deps already listed — React Compiler ensures stable reference
  useEffect(() => {
    if (!mounted) return;

    if (
      ready &&
      authenticated &&
      user?.id &&
      hasSuiWallet &&
      hasSolanaWallet &&
      !effectiveLinkedUsers[user.id]
    ) {
      linkWallets();
    }
  }, [
    mounted,
    ready,
    authenticated,
    user?.id,
    hasSuiWallet,
    hasSolanaWallet,
    effectiveLinkedUsers,
  ]);

  return {
    isRegistered: user?.id
      ? (effectiveRegisteredUsers[user.id] ?? false)
      : false,
    isLinked: user?.id ? (effectiveLinkedUsers[user.id] ?? false) : false,
  };
};

export default useWalletRegistration;
