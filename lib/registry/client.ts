import { post } from '@/lib/api/client';

export interface LinkSolanaResult {
  digest: string;
  suiAddress: string;
  solanaAddress: string;
}

export const linkSolanaWallet = (userId: string, solanaSignature: string) =>
  post<LinkSolanaResult>('/api/wallet/link-solana', {
    userId,
    solanaSignature,
  });
