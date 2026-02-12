'use client';

import { usePrivy } from '@privy-io/react-auth';
import invariant from 'tiny-invariant';
import { address } from '@solana/kit';
import { fetchMaybeNonce, NonceState } from '@solana-program/system';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import useSolanaRpc from '@/hooks/blockchain/use-solana-connection';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';
import { useOnboarding } from '@/hooks/store/use-onboarding';
import { ApiRequestError } from '@/lib/api/client';
import { deriveNonceAddress } from '@/lib/solana/nonce';
import { createNonceAccount } from '@/lib/wallet/client';

const useNonceAccount = () => {
  const { user } = usePrivy();
  const { getAddress } = useWalletAddresses();
  const solanaAddress = getAddress('solana');
  const rpc = useSolanaRpc();
  const queryClient = useQueryClient();

  const queryKey = ['solana-nonce', solanaAddress];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!solanaAddress) return { exists: false as const };

      const nonceAddr = await deriveNonceAddress(address(solanaAddress));
      const account = await fetchMaybeNonce(rpc, nonceAddr);

      if (account.exists && account.data.state === NonceState.Initialized) {
        return {
          exists: true as const,
          nonceAddress: nonceAddr as string,
        };
      }

      return { exists: false as const, nonceAddress: nonceAddr as string };
    },
    enabled: !!solanaAddress,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const hasNonce = data?.exists ?? false;
  const nonceAddress = data?.nonceAddress ?? null;

  // Sync nonce address to Zustand for global access
  useEffect(() => {
    if (hasNonce && nonceAddress) {
      useOnboarding.setState({ nonceAddress });
    }
  }, [hasNonce, nonceAddress]);

  const setNonceExists = (addr: string) => {
    useOnboarding.setState({ nonceAddress: addr });
    queryClient.setQueryData(queryKey, {
      exists: true as const,
      nonceAddress: addr,
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      invariant(user, 'Not authenticated');
      try {
        return await createNonceAccount(user.id);
      } catch (err) {
        // 409 = nonce already exists — treat as success
        if (err instanceof ApiRequestError && err.code === 'NONCE_EXISTS') {
          return { signature: '', nonceAddress: nonceAddress ?? '' };
        }
        throw err;
      }
    },
    onSuccess: (result) => {
      setNonceExists(result.nonceAddress);
    },
  });

  return {
    hasNonce,
    nonceAddress,
    isLoading,
    create: mutation.mutate,
    isCreating: mutation.isPending,
    createError: mutation.error,
    refetch,
  };
};

export default useNonceAccount;
