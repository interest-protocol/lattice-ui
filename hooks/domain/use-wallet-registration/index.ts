import { usePrivy, useUser } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import {
  WALLETS_LINKED_KEY,
  WALLETS_REGISTERED_KEY,
} from '@/constants/storage-keys';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useOnboarding } from '@/hooks/store/use-onboarding';
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

  const onboarding = useOnboarding;

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
    onboarding.getState().setStep('creating-wallets');

    try {
      const needsSui = !hasSuiWallet;
      const needsSolana = !hasSolanaWallet;

      if (needsSui || needsSolana) {
        const [suiResult] = await Promise.all([
          needsSui ? createSuiWallet(user.id) : null,
          needsSolana ? createSolanaWallet(user.id) : null,
        ]);

        if (suiResult) {
          createdSuiAddressRef.current = suiResult.address;
          onboarding.getState().setSuiAddress(suiResult.address);
        }

        try {
          await refreshUser();
        } catch {
          // Refresh failure is non-fatal — linking effect will still
          // trigger once Privy eventually syncs on its own.
        }
      }

      setRegisteredUsers((prev) => ({ ...prev, [user.id]: true }));

      // Always show funding step after wallet creation — gives Privy time
      // to propagate wallets server-side before linking is attempted.
      const suiAddr = getAddress('sui') || createdSuiAddressRef.current;
      if (suiAddr) {
        onboarding.getState().setSuiAddress(suiAddr);
        onboarding.getState().setStep('funding');
      }
    } catch (_error) {
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[retryCount];
        isRegistering.current = false;
        retryTimerRef.current = setTimeout(
          () => registerWallets(retryCount + 1),
          delay
        );
        return;
      }

      onboarding.getState().setError('Wallet setup failed. Please try again.');
    } finally {
      isRegistering.current = false;
    }
  };

  const retryLink = () => {
    isLinking.current = false;
    onboarding.getState().setStep('linking');
    linkWallets(0);
  };

  const linkWallets = async (retryCount = 0) => {
    if (!user?.id || isLinking.current) return;
    if (effectiveLinkedUsers[user.id]) return;
    if (!(hasSuiWallet && hasSolanaWallet)) return;

    isLinking.current = true;
    onboarding.getState().setStep('linking');

    try {
      await linkSolanaWallet(user.id);
      setLinkedUsers((prev) => ({ ...prev, [user.id]: true }));
      onboarding.getState().setStep('complete');
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.code === 'INSUFFICIENT_GAS'
      ) {
        const suiAddress = getAddress('sui') || createdSuiAddressRef.current;
        if (suiAddress) {
          isLinking.current = false;
          onboarding.getState().setSuiAddress(suiAddress);
          onboarding.getState().setStep('funding');
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

      onboarding
        .getState()
        .setError('Wallet linking failed. Please try again.');
    } finally {
      isLinking.current = false;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: retryLink closes over wallet state — we re-set it when wallet deps change
  useEffect(() => {
    onboarding.getState().setRetryLink(retryLink);
  }, [hasSuiWallet, hasSolanaWallet]);

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
    if (isRegistering.current) return;

    // Don't auto-link if the user is at the funding step — let FundingStep trigger it via retryLink
    if (onboarding.getState().step === 'funding') return;

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
