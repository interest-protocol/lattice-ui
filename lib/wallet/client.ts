import type { ChainKey } from '@/constants/chains';
import { get, post } from '@/lib/api/client';

export interface CreateWalletResult {
  id: string;
  address: string;
  chainType: string;
}

export interface SendSuiResult {
  digest: string;
}

export interface SendSolanaResult {
  signature: string;
}

export interface LinkSolanaSuccess {
  digest: string;
  suiAddress: string;
  solanaAddress: string;
  alreadyLinked?: undefined;
}

export interface LinkSolanaAlreadyLinked {
  alreadyLinked: true;
  digest: null;
  suiAddress: string;
  solanaAddress: string;
}

export interface LinkSolanaAlreadyLinkedFromError {
  alreadyLinked: true;
  digest: null;
  suiAddress: null;
  solanaAddress: null;
  code: 'ALREADY_LINKED';
}

export type LinkSolanaResult =
  | LinkSolanaSuccess
  | LinkSolanaAlreadyLinked
  | LinkSolanaAlreadyLinkedFromError;

export const createSuiWallet = (userId: string) =>
  post<CreateWalletResult>('/api/wallet/create-sui', { userId });

export const createSolanaWallet = (userId: string) =>
  post<CreateWalletResult>('/api/wallet/create-solana', { userId });

export const sendSui = (params: {
  userId: string;
  recipient: string;
  amount: string;
  coinType?: string;
}) => post<SendSuiResult>('/api/wallet/send-sui', params);

export const sendSolana = (params: {
  userId: string;
  recipient: string;
  amount: string;
  mint?: string;
}) => post<SendSolanaResult>('/api/wallet/send-solana', params);

export const linkSolanaWallet = (userId: string) =>
  post<LinkSolanaResult>('/api/wallet/link-solana', { userId });

export interface CheckRegistrationResult {
  registered: boolean;
  suiAddress: string | null;
  solanaAddress: string | null;
  hasWallets: boolean;
}

export const checkRegistration = () =>
  get<CheckRegistrationResult>('/api/wallet/check-registration');

// Unified send interface

interface SendTokensParams {
  userId: string;
  recipient: string;
  amount: string;
  tokenType?: string;
}

interface SendTokensResult {
  txId: string;
}

type SendHandler = (params: SendTokensParams) => Promise<SendTokensResult>;

const SEND_HANDLERS: Record<ChainKey, SendHandler> = {
  sui: async (p) => {
    const result = await sendSui({
      userId: p.userId,
      recipient: p.recipient,
      amount: p.amount,
      coinType: p.tokenType,
    });
    return { txId: result.digest };
  },
  solana: async (p) => {
    const result = await sendSolana({
      userId: p.userId,
      recipient: p.recipient,
      amount: p.amount,
      mint: p.tokenType,
    });
    return { txId: result.signature };
  },
};

export const sendTokens = (
  chainKey: ChainKey,
  params: SendTokensParams
): Promise<SendTokensResult> => SEND_HANDLERS[chainKey](params);

export interface CreateNonceAccountResult {
  signature: string;
  nonceAddress: string;
}

export const createNonceAccount = (userId: string) =>
  post<CreateNonceAccountResult>('/api/wallet/create-nonce', { userId });
