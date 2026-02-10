import { post } from '@/lib/api/client';

export interface PriceQuote {
  coin: string;
  price: number;
}

export const fetchCoinPrices = (coins: ReadonlyArray<string>) =>
  post<ReadonlyArray<PriceQuote>>('/api/external/prices', { coins });
