import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { toasting } from '@/components/toast';
import {
  WALLETS_LINKED_KEY,
  WALLETS_REGISTERED_KEY,
} from '@/constants/storage-keys';
import useWalletAddresses from '@/hooks/use-wallet-addresses';
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
  const { hasSuiWallet, hasSolanaWallet } = useWalletAddresses();
  const [mounted, setMounted] = useState(false);
  const [registeredUsers, setRegisteredUsers] =
    useLocalStorage<RegisteredUsers>(WALLETS_REGISTERED_KEY, {});
  const [linkedUsers, setLinkedUsers] = useLocalStorage<LinkedUsers>(
    WALLETS_LINKED_KEY,
    {}
  );
  const isRegistering = useRef(false);
  const isLinking = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveRegisteredUsers = mounted ? registeredUsers : {};
  const effectiveLinkedUsers = mounted ? linkedUsers : {};

  const registerWallets = useCallback(
    async (retryCount = 0) => {
      if (!user?.id || isRegistering.current) return;
      if (effectiveRegisteredUsers[user.id]) return;

      isRegistering.current = true;
      const WALLET_SETUP_TOAST_ID = 'wallet-setup';

      try {
        const promises: Promise<unknown>[] = [];

        if (!hasSuiWallet) {
          promises.push(createSuiWallet(user.id));
        }

        if (!hasSolanaWallet) {
          promises.push(createSolanaWallet(user.id));
        }

        if (promises.length > 0) {
          const message =
            retryCount > 0
              ? 'Retrying wallet setup...'
              : 'Setting up your wallets...';
          toasting.loadingWithId({ message }, WALLET_SETUP_TOAST_ID);
          await Promise.all(promises);
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
          setTimeout(() => registerWallets(retryCount + 1), delay);
          return;
        }

        toasting.error({
          action: 'Wallet Setup',
          message: 'Please refresh the page',
        });
      } finally {
        isRegistering.current = false;
      }
    },
    [
      user?.id,
      hasSuiWallet,
      hasSolanaWallet,
      effectiveRegisteredUsers,
      setRegisteredUsers,
    ]
  );

  const linkWallets = useCallback(
    async (retryCount = 0) => {
      if (!user?.id || isLinking.current) return;
      if (effectiveLinkedUsers[user.id]) return;
      if (!hasSuiWallet || !hasSolanaWallet) return;

      isLinking.current = true;

      try {
        await linkSolanaWallet(user.id);
        setLinkedUsers((prev) => ({ ...prev, [user.id]: true }));
      } catch (_error) {
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_DELAYS_MS[retryCount];
          isLinking.current = false;
          setTimeout(() => linkWallets(retryCount + 1), delay);
          return;
        }

        toasting.error({
          action: 'Wallet Link',
          message: 'Please refresh the page',
        });
      } finally {
        isLinking.current = false;
      }
    },
    [
      user?.id,
      hasSuiWallet,
      hasSolanaWallet,
      effectiveLinkedUsers,
      setLinkedUsers,
    ]
  );

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
  }, [
    mounted,
    ready,
    authenticated,
    user?.id,
    effectiveRegisteredUsers,
    registerWallets,
  ]);

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
    linkWallets,
  ]);

  return {
    isRegistered: user?.id
      ? (effectiveRegisteredUsers[user.id] ?? false)
      : false,
    isLinked: user?.id ? (effectiveLinkedUsers[user.id] ?? false) : false,
  };
};

export default useWalletRegistration;
