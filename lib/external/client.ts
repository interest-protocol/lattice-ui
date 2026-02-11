import { post } from '@/lib/api/client';

export interface PriceQuote {
  coin: string;
  price: number;
}

export const fetchCoinPrices = (coins: readonly string[]) =>
  post<readonly PriceQuote[]>('/api/external/prices', { coins });
