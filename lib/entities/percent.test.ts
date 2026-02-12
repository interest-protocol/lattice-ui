import { describe, expect, it } from 'vitest';

import { CurrencyAmount } from './currency-amount';
import { Percent } from './percent';
import { Token } from './token';

describe('Percent', () => {
  describe('fromBps', () => {
    it('creates 0.3% from 30 basis points', () => {
      const pct = Percent.fromBps(30);
      expect(pct.toPercent(2)).toBe('0.30%');
    });

    it('creates 1% from 100 basis points', () => {
      const pct = Percent.fromBps(100);
      expect(pct.toPercent(2)).toBe('1.00%');
    });

    it('creates 100% from 10000 basis points', () => {
      const pct = Percent.fromBps(10000);
      expect(pct.toPercent(2)).toBe('100.00%');
    });

    it('creates 0.5% from 50 basis points', () => {
      const pct = Percent.fromBps(50);
      expect(pct.toPercent(2)).toBe('0.50%');
    });
  });

  describe('fromPercent', () => {
    it('creates from percentage value', () => {
      const pct = Percent.fromPercent(0.3);
      expect(pct.toPercent(2)).toBe('0.30%');
    });

    it('creates 5% from value 5', () => {
      const pct = Percent.fromPercent(5);
      expect(pct.toPercent(2)).toBe('5.00%');
    });
  });

  describe('applyTo', () => {
    it('applies 50 bps (0.5%) to 100 SUI', () => {
      const pct = Percent.fromBps(50);
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '100');
      const result = pct.applyTo(amount);
      // 0.5% of 100 = 0.5
      expect(result.toNumber()).toBeCloseTo(0.5, 4);
    });

    it('applies 1% to 1000 SOL', () => {
      const pct = Percent.fromBps(100);
      const amount = CurrencyAmount.fromHumanAmount(Token.SOL, '1000');
      const result = pct.applyTo(amount);
      expect(result.toNumber()).toBeCloseTo(10, 4);
    });
  });

  describe('feeFrom', () => {
    it('calculates fee correctly', () => {
      const pct = Percent.fromBps(30); // 0.3%
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '100');
      const [afterFee, fee] = pct.feeFrom(amount);

      // Fee should be ~0.3 SUI, afterFee should be ~99.7 SUI
      expect(fee.toNumber()).toBeCloseTo(0.3, 1);
      expect(afterFee.toNumber()).toBeCloseTo(99.7, 1);
    });

    it('fee rounds up (ceiling)', () => {
      const pct = Percent.fromBps(1); // 0.01%
      const amount = CurrencyAmount.fromRawAmount(Token.SUI, '999');
      const [afterFee, fee] = pct.feeFrom(amount);

      // 0.01% of 999 = 0.0999 raw → rounds up to 1
      expect(fee.raw).toBe(1n);
      expect(afterFee.raw).toBe(998n);
    });

    it('afterFee + fee >= original', () => {
      const pct = Percent.fromBps(30);
      const amount = CurrencyAmount.fromRawAmount(Token.SUI, '1000000001');
      const [afterFee, fee] = pct.feeFrom(amount);

      const total = afterFee.raw + fee.raw;
      expect(total >= amount.raw).toBe(true);
    });

    it('fee from zero amount is zero', () => {
      const pct = Percent.fromBps(30);
      const amount = CurrencyAmount.zero(Token.SUI);
      const [afterFee, fee] = pct.feeFrom(amount);
      expect(fee.raw).toBe(0n);
      expect(afterFee.raw).toBe(0n);
    });

    it('rounds up across multiple inputs', () => {
      const pct = Percent.fromBps(1); // 0.01%
      const rawValues = [1n, 999n, 10001n, 123456789n];
      for (const raw of rawValues) {
        const amount = CurrencyAmount.fromRawAmount(Token.SUI, raw);
        const [afterFee, fee] = pct.feeFrom(amount);
        // afterFee + fee should always >= original (rounding up fee)
        expect(afterFee.raw + fee.raw).toBeGreaterThanOrEqual(amount.raw);
      }
    });
  });

  describe('fromPercent edge values', () => {
    it('creates 0% from value 0', () => {
      const pct = Percent.fromPercent(0);
      expect(pct.toPercent(2)).toBe('0.00%');
    });

    it('creates 100% from value 100', () => {
      const pct = Percent.fromPercent(100);
      expect(pct.toPercent(2)).toBe('100.00%');
    });
  });

  describe('applyTo with zero slippage', () => {
    it('returns zero when applying 0 bps', () => {
      const pct = Percent.fromBps(0);
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '100');
      const result = pct.applyTo(amount);
      expect(result.raw).toBe(0n);
    });
  });
});
