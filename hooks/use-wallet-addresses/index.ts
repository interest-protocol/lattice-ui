import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';

export interface WalletAddresses {
  suiAddress: string | null;
  solanaAddress: string | null;
  hasSuiWallet: boolean;
  hasSolanaWallet: boolean;
}

/**
 * Centralized hook for extracting wallet addresses from Privy user.
 * Eliminates duplicated wallet extraction logic across the codebase.
 *
 * @returns {WalletAddresses} Object containing wallet addresses and availability flags
 *
 * @example
 * const { suiAddress, solanaAddress, hasSuiWallet, hasSolanaWallet } = useWalletAddresses();
 */
export const useWalletAddresses = (): WalletAddresses => {
  const { user } = usePrivy();

  return useMemo(() => {
    const suiWallet = user?.linkedAccounts?.find((account) => {
      if (account.type !== 'wallet' || !('address' in account)) return false;
      if (
        'chainType' in account &&
        String(account.chainType).toLowerCase() === 'sui'
      )
        return true;
      // Fallback: check address format for Sui (0x prefix, 66 chars)
      return (
        typeof account.address === 'string' &&
        account.address.startsWith('0x') &&
        account.address.length === 66
      );
    });

    const solanaWallet = user?.linkedAccounts?.find((account) => {
      if (account.type !== 'wallet' || !('address' in account)) return false;
      if (
        'chainType' in account &&
        String(account.chainType).toLowerCase() === 'solana'
      )
        return true;
      // Fallback: check address format for Solana (base58, 32-44 chars)
      return (
        typeof account.address === 'string' &&
        !account.address.startsWith('0x') &&
        account.address.length >= 32 &&
        account.address.length <= 44
      );
    });

    const suiAddress =
      suiWallet && 'address' in suiWallet
        ? (suiWallet.address as string)
        : null;
    const solanaAddress =
      solanaWallet && 'address' in solanaWallet
        ? (solanaWallet.address as string)
        : null;

    return {
      suiAddress,
      solanaAddress,
      hasSuiWallet: Boolean(suiWallet),
      hasSolanaWallet: Boolean(solanaWallet),
    };
  }, [user]);
};

export default useWalletAddresses;
