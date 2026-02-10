import { usePrivy } from '@privy-io/react-auth';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useLocalStorage } from 'usehooks-ts';

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

  // Track mount state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use empty objects until mounted to avoid hydration mismatch
  const effectiveRegisteredUsers = mounted ? registeredUsers : {};
  const effectiveLinkedUsers = mounted ? linkedUsers : {};

  const registerWallets = useCallback(
    async (retryCount = 0) => {
      if (!user?.id || isRegistering.current) return;
      if (effectiveRegisteredUsers[user.id]) return;

      isRegistering.current = true;

      try {
        const promises: Promise<unknown>[] = [];

        // Create SUI wallet if missing
        if (!hasSuiWallet) {
          promises.push(createSuiWallet(user.id));
        }

        // Create Solana wallet if missing
        if (!hasSolanaWallet) {
          promises.push(createSolanaWallet(user.id));
        }

        // Run wallet creations in parallel
        if (promises.length > 0) {
          await Promise.all(promises);
        }

        // Mark as registered
        setRegisteredUsers((prev) => ({ ...prev, [user.id]: true }));
      } catch (error) {
        console.error('Failed to register wallets:', error);

        // Retry with exponential backoff
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_DELAYS_MS[retryCount];
          isRegistering.current = false;
          setTimeout(() => registerWallets(retryCount + 1), delay);
          return;
        }

        // After all retries failed, notify user
        toast.error('Failed to set up wallets. Please refresh the page.');
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
      } catch (error) {
        console.error('Failed to link wallets:', error);

        // Retry with exponential backoff
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          const delay = RETRY_DELAYS_MS[retryCount];
          isLinking.current = false;
          setTimeout(() => linkWallets(retryCount + 1), delay);
          return;
        }

        // After all retries failed, notify user
        toast.error('Failed to link wallets. Please refresh the page.');
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

  // Auto-register on mount when authenticated
  useEffect(() => {
    if (
      ready &&
      authenticated &&
      user?.id &&
      !effectiveRegisteredUsers[user.id]
    ) {
      registerWallets();
    }
  }, [
    ready,
    authenticated,
    user?.id,
    effectiveRegisteredUsers,
    registerWallets,
  ]);

  // Auto-link after wallets exist
  useEffect(() => {
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
