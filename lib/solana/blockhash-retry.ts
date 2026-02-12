export const BLOCKHASH_RETRY_ATTEMPTS = 3;
export const BLOCKHASH_RETRY_DELAY_MS = 500;

export const isBlockhashError = (err: unknown): boolean => {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('Blockhash not found') || msg.includes('blockhash');
};
