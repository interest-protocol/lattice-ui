import { describe, expect, it } from 'vitest';

import { CurrencyAmount } from './currency-amount';
import { Token } from './token';

describe('CurrencyAmount', () => {
  describe('factories', () => {
    it('creates from raw amount', () => {
      const amount = CurrencyAmount.fromRawAmount(Token.SUI, 1500000000n);
      expect(amount.raw).toBe(1500000000n);
      expect(amount.token.symbol).toBe('SUI');
    });

    it('creates from human amount', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      expect(amount.raw > 0n).toBe(true);
      // 1.5 * 10^9 = 1500000000
      expect(amount.raw).toBe(1500000000n);
    });

    it('creates from numeric human amount', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SOL, 2.0);
      expect(amount.raw).toBe(2000000000n);
    });

    it('creates zero amount', () => {
      const zero = CurrencyAmount.zero(Token.SUI);
      expect(zero.isZero()).toBe(true);
      expect(zero.raw).toBe(0n);
    });

    it('handles empty string as zero', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '');
      expect(amount.isZero()).toBe(true);
    });
  });

  describe('display', () => {
    it('toFixed formats correctly', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      expect(amount.toFixed(4)).toBe('1.5000');
    });

    it('toFixed with 2 decimal places', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '100');
      expect(amount.toFixed(2)).toBe('100.00');
    });

    it('toNumber returns numeric value', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      expect(amount.toNumber()).toBeCloseTo(1.5, 4);
    });
  });

  describe('arithmetic', () => {
    it('adds two amounts', () => {
      const a = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      const b = CurrencyAmount.fromHumanAmount(Token.SUI, '2.5');
      const result = a.add(b);
      expect(result.toNumber()).toBeCloseTo(4.0, 4);
    });

    it('subtracts two amounts', () => {
      const a = CurrencyAmount.fromHumanAmount(Token.SUI, '5.0');
      const b = CurrencyAmount.fromHumanAmount(Token.SUI, '2.0');
      const result = a.subtract(b);
      expect(result.toNumber()).toBeCloseTo(3.0, 4);
    });

    it('multiplies by a factor', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '2.0');
      const result = amount.multiply(3);
      expect(result.toNumber()).toBeCloseTo(6.0, 4);
    });

    it('throws on mismatched tokens in add', () => {
      const sui = CurrencyAmount.fromHumanAmount(Token.SUI, '1');
      const sol = CurrencyAmount.fromHumanAmount(Token.SOL, '1');
      expect(() => sui.add(sol)).toThrow('Token mismatch');
    });

    it('throws on mismatched tokens in subtract', () => {
      const sui = CurrencyAmount.fromHumanAmount(Token.SUI, '1');
      const sol = CurrencyAmount.fromHumanAmount(Token.SOL, '1');
      expect(() => sui.subtract(sol)).toThrow('Token mismatch');
    });
  });

  describe('comparisons', () => {
    it('greaterThan returns true when greater', () => {
      const a = CurrencyAmount.fromHumanAmount(Token.SUI, '2');
      const b = CurrencyAmount.fromHumanAmount(Token.SUI, '1');
      expect(a.greaterThan(b)).toBe(true);
    });

    it('lessThan returns true when less', () => {
      const a = CurrencyAmount.fromHumanAmount(Token.SUI, '1');
      const b = CurrencyAmount.fromHumanAmount(Token.SUI, '2');
      expect(a.lessThan(b)).toBe(true);
    });

    it('equalTo returns true for same amounts', () => {
      const a = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      const b = CurrencyAmount.fromHumanAmount(Token.SUI, '1.5');
      expect(a.equalTo(b)).toBe(true);
    });

    it('isPositive returns true for positive amounts', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '1');
      expect(amount.isPositive()).toBe(true);
    });

    it('isPositive returns false for zero', () => {
      const zero = CurrencyAmount.zero(Token.SUI);
      expect(zero.isPositive()).toBe(false);
    });

    it('exceedsBalance correctly identifies insufficient balance', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '10');
      const balance = CurrencyAmount.fromHumanAmount(Token.SUI, '5');
      expect(amount.exceedsBalance(balance)).toBe(true);
    });

    it('exceedsBalance correctly identifies sufficient balance', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '3');
      const balance = CurrencyAmount.fromHumanAmount(Token.SUI, '5');
      expect(amount.exceedsBalance(balance)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles very large raw amounts', () => {
      const raw = 999999999999999999n;
      const amount = CurrencyAmount.fromRawAmount(Token.SUI, raw);
      expect(amount.raw).toBe(999999999999999999n);
      expect(amount.isPositive()).toBe(true);
    });

    it('fromRawAmount with string', () => {
      const amount = CurrencyAmount.fromRawAmount(Token.SOL, '1000000000');
      expect(amount.toNumber()).toBeCloseTo(1.0, 4);
    });
  });
});
