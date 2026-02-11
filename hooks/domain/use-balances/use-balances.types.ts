import type { CurrencyAmount } from '@/lib/entities';

export interface UseBalancesOptions {
  suiAddress?: string | null;
}

export interface UseBalancesReturn {
  suiAddress: string | null;
  solanaAddress: string | null;
  suiBalances: { sui: bigint; wsol: bigint };
  solanaBalances: { sol: bigint; wsui: bigint };
  suiAmounts: { sui: CurrencyAmount };
  solanaAmounts: { sol: CurrencyAmount };
  suiLoading: boolean;
  solLoading: boolean;
  isLoading: boolean;
  mutateSuiBalances: () => Promise<{ sui: bigint; wsol: bigint }>;
  mutateSolanaBalances: () => Promise<{ sol: bigint; wsui: bigint }>;
  getBalance: (type: string) => bigint;
  allBalances: Record<string, bigint>;
}
