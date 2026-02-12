import { CurrencyAmount, Token } from '@/lib/entities';

// Raw amounts (9 decimals)
export const ONE_SUI = 1_000_000_000n;
export const ONE_SOL = 1_000_000_000n;
export const HALF_SUI = 500_000_000n;

// Pre-built CurrencyAmounts (factory fns to avoid cross-test mutation)
export const oneSui = () => CurrencyAmount.fromRawAmount(Token.SUI, ONE_SUI);
export const oneSol = () => CurrencyAmount.fromRawAmount(Token.SOL, ONE_SOL);
export const zeroSui = () => CurrencyAmount.zero(Token.SUI);

// Mock prices
export const MOCK_PRICES = { suiUsd: 3.5, solUsd: 180.0 } as const;

// Mock addresses
export const MOCK_SUI_ADDRESS = '0x' + 'ab'.repeat(32);
export const MOCK_SOL_ADDRESS = 'SoLaNa' + '1'.repeat(38);
