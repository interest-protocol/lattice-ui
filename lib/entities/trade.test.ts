import { describe, expect, it } from 'vitest';

import { CurrencyAmount } from './currency-amount';
import { Percent } from './percent';
import { Token } from './token';
import { Trade } from './trade';

const suiToSolTrade = (
  humanAmount: string,
  opts?: { suiPrice?: number; solPrice?: number; slippage?: Percent }
) =>
  Trade.fromOraclePrices({
    inputAmount: CurrencyAmount.fromHumanAmount(Token.SUI, humanAmount),
    outputToken: Token.SOL,
    inputPriceUsd: opts?.suiPrice ?? 3.5,
    outputPriceUsd: opts?.solPrice ?? 180.0,
    slippage: opts?.slippage,
  });

const solToSuiTrade = (
  humanAmount: string,
  opts?: { suiPrice?: number; solPrice?: number; slippage?: Percent }
) =>
  Trade.fromOraclePrices({
    inputAmount: CurrencyAmount.fromHumanAmount(Token.SOL, humanAmount),
    outputToken: Token.SUI,
    inputPriceUsd: opts?.solPrice ?? 180.0,
    outputPriceUsd: opts?.suiPrice ?? 3.5,
    slippage: opts?.slippage,
  });

describe('Trade', () => {
  describe('fromOraclePrices', () => {
    it('calculates SUI→SOL output at known prices', () => {
      const trade = suiToSolTrade('0.1');
      // rate = 3.5 / 180 ≈ 0.019444
      // output = 0.1 * rate ≈ 0.001944
      expect(trade.expectedOutput.toNumber()).toBeCloseTo(
        0.1 * (3.5 / 180),
        4
      );
    });

    it('calculates SOL→SUI output at known prices', () => {
      const trade = solToSuiTrade('0.001');
      // rate = 180 / 3.5 ≈ 51.4286
      // output = 0.001 * rate ≈ 0.0514286
      expect(trade.expectedOutput.toNumber()).toBeCloseTo(
        0.001 * (180 / 3.5),
        3
      );
    });

    it('uses default 0.5% slippage', () => {
      const trade = suiToSolTrade('0.1');
      expect(trade.slippage.toPercent(2)).toBe('0.50%');
    });

    it('applies custom slippage', () => {
      const trade = suiToSolTrade('0.1', {
        slippage: Percent.fromBps(100),
      });
      expect(trade.slippage.toPercent(2)).toBe('1.00%');
    });

    it('minimumReceived is less than expectedOutput', () => {
      const trade = suiToSolTrade('0.1');
      expect(
        trade.minimumReceived.lessThan(trade.expectedOutput) ||
          trade.minimumReceived.equalTo(trade.expectedOutput)
      ).toBe(true);
    });

    it('stores the rate', () => {
      const trade = suiToSolTrade('0.1');
      expect(trade.rate).toBeCloseTo(3.5 / 180, 6);
    });
  });

  describe('validation', () => {
    it('throws on zero inputPrice', () => {
      expect(() =>
        Trade.fromOraclePrices({
          inputAmount: CurrencyAmount.fromHumanAmount(Token.SUI, '0.1'),
          outputToken: Token.SOL,
          inputPriceUsd: 0,
          outputPriceUsd: 180,
        })
      ).toThrow('Input price must be positive');
    });

    it('throws on negative inputPrice', () => {
      expect(() =>
        Trade.fromOraclePrices({
          inputAmount: CurrencyAmount.fromHumanAmount(Token.SUI, '0.1'),
          outputToken: Token.SOL,
          inputPriceUsd: -1,
          outputPriceUsd: 180,
        })
      ).toThrow('Input price must be positive');
    });

    it('throws on zero outputPrice', () => {
      expect(() =>
        Trade.fromOraclePrices({
          inputAmount: CurrencyAmount.fromHumanAmount(Token.SUI, '0.1'),
          outputToken: Token.SOL,
          inputPriceUsd: 3.5,
          outputPriceUsd: 0,
        })
      ).toThrow('Output price must be positive');
    });
  });

  describe('route', () => {
    it('displays SUI → SOL', () => {
      const trade = suiToSolTrade('0.1');
      expect(trade.route).toBe('SUI → SOL');
    });

    it('displays SOL → SUI', () => {
      const trade = solToSuiTrade('0.001');
      expect(trade.route).toBe('SOL → SUI');
    });
  });

  describe('rateDisplay', () => {
    it('formats as "1 SUI ≈ X.XXXXXX SOL"', () => {
      const trade = suiToSolTrade('0.1');
      expect(trade.rateDisplay).toMatch(/^1 SUI ≈ \d+\.\d{6} SOL$/);
    });

    it('formats as "1 SOL ≈ X.XXXXXX SUI"', () => {
      const trade = solToSuiTrade('0.001');
      expect(trade.rateDisplay).toMatch(/^1 SOL ≈ \d+\.\d{6} SUI$/);
    });
  });

  describe('edge cases', () => {
    it('handles very small amount (1 raw unit)', () => {
      const trade = Trade.fromOraclePrices({
        inputAmount: CurrencyAmount.fromRawAmount(Token.SUI, 1n),
        outputToken: Token.SOL,
        inputPriceUsd: 3.5,
        outputPriceUsd: 180.0,
      });
      // Should not throw, output may be 0 due to precision
      expect(trade.expectedOutput.raw).toBeGreaterThanOrEqual(0n);
    });

    it('slippage = 0 means min equals expected', () => {
      const trade = suiToSolTrade('0.1', {
        slippage: Percent.fromBps(0),
      });
      expect(trade.minimumReceived.raw).toBe(trade.expectedOutput.raw);
    });
  });

  describe('invariants', () => {
    it('minimumReceived is always <= expectedOutput across multiple inputs', () => {
      const amounts = ['0.001', '0.01', '0.1', '0.5'];
      for (const amount of amounts) {
        const trade = suiToSolTrade(amount);
        expect(trade.minimumReceived.raw <= trade.expectedOutput.raw).toBe(
          true
        );
      }
    });
  });
});
