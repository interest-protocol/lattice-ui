import { describe, expect, it, vi } from 'vitest';

import { FixedPointMath } from './fixed-point-math';

const ONE_COIN = 10n ** 9n;

describe('FixedPointMath', () => {
  describe('toBigNumber', () => {
    it('converts 1.5 to raw bigint', () => {
      expect(FixedPointMath.toBigNumber(1.5, 9)).toBe(1_500_000_000n);
    });

    it('converts 0 to 0n', () => {
      expect(FixedPointMath.toBigNumber(0, 9)).toBe(0n);
    });

    it('converts string "0.001" correctly', () => {
      expect(FixedPointMath.toBigNumber('0.001', 9)).toBe(1_000_000n);
    });

    it('returns 0n for NaN', () => {
      expect(FixedPointMath.toBigNumber(Number.NaN, 9)).toBe(0n);
    });

    it('throws RangeError for negative', () => {
      expect(() => FixedPointMath.toBigNumber(-1, 9)).toThrow(RangeError);
    });

    it('works with 6 decimals', () => {
      expect(FixedPointMath.toBigNumber(1.5, 6)).toBe(1_500_000n);
    });

    it('works with 18 decimals', () => {
      expect(FixedPointMath.toBigNumber(1.5, 18)).toBe(
        1_500_000_000_000_000_000n
      );
    });

    it('defaults to 9 decimals', () => {
      expect(FixedPointMath.toBigNumber(1)).toBe(1_000_000_000n);
    });

    it('converts integer string', () => {
      expect(FixedPointMath.toBigNumber('42', 9)).toBe(42_000_000_000n);
    });
  });

  describe('toNumber', () => {
    it('converts raw bigint to number', () => {
      expect(FixedPointMath.toNumber(1_500_000_000n, 9)).toBeCloseTo(1.5, 4);
    });

    it('returns 0 for 0n', () => {
      expect(FixedPointMath.toNumber(0n, 9)).toBe(0);
    });

    it('handles precision with significant digits', () => {
      const result = FixedPointMath.toNumber(1_234_567_890n, 9, 6);
      expect(result).toBeCloseTo(1.23457, 4);
    });

    it('floors when decimals is 0', () => {
      expect(FixedPointMath.toNumber(5n, 0)).toBe(5);
    });
  });

  describe('from / value', () => {
    it('creates instance and returns stored bigint', () => {
      const fp = FixedPointMath.from(42n);
      expect(fp.value()).toBe(42n);
    });

    it('creates from number', () => {
      const fp = FixedPointMath.from(42);
      expect(fp.value()).toBe(42n);
    });

    it('creates from string', () => {
      const fp = FixedPointMath.from('42');
      expect(fp.value()).toBe(42n);
    });
  });

  describe('div', () => {
    it('divides correctly', () => {
      const a = FixedPointMath.from(3n * ONE_COIN);
      const b = FixedPointMath.from(2n * ONE_COIN);
      const result = a.div(b);
      // (3e9 * 1e9) / 2e9 = 1.5e9
      expect(result.value()).toBe(1_500_000_000n);
    });

    it('throws on division by zero', () => {
      const a = FixedPointMath.from(ONE_COIN);
      expect(() => a.div(0n)).toThrow('division by zero');
    });
  });

  describe('mul', () => {
    it('multiplies correctly', () => {
      const a = FixedPointMath.from(2n * ONE_COIN);
      const b = FixedPointMath.from(3n * ONE_COIN);
      const result = a.mul(b);
      // (2e9 * 3e9) / 1e9 = 6e9
      expect(result.value()).toBe(6n * ONE_COIN);
    });

    it('zero times anything is zero', () => {
      const a = FixedPointMath.from(0n);
      const result = a.mul(ONE_COIN);
      expect(result.value()).toBe(0n);
    });
  });

  describe('add / sub', () => {
    it('adds two values', () => {
      const a = FixedPointMath.from(ONE_COIN);
      const b = FixedPointMath.from(ONE_COIN);
      expect(a.add(b).value()).toBe(2n * ONE_COIN);
    });

    it('subtracts two values', () => {
      const a = FixedPointMath.from(3n * ONE_COIN);
      const b = FixedPointMath.from(ONE_COIN);
      expect(a.sub(b).value()).toBe(2n * ONE_COIN);
    });
  });

  describe('comparisons', () => {
    const two = FixedPointMath.from(2n * ONE_COIN);
    const three = FixedPointMath.from(3n * ONE_COIN);
    const twoAgain = FixedPointMath.from(2n * ONE_COIN);

    it('gt returns true when greater', () => {
      expect(three.gt(two)).toBe(true);
    });

    it('gt returns false when less', () => {
      expect(two.gt(three)).toBe(false);
    });

    it('gt returns false when equal', () => {
      expect(two.gt(twoAgain)).toBe(false);
    });

    it('gte returns true when greater', () => {
      expect(three.gte(two)).toBe(true);
    });

    it('gte returns true when equal', () => {
      expect(two.gte(twoAgain)).toBe(true);
    });

    it('lt returns true when less', () => {
      expect(two.lt(three)).toBe(true);
    });

    it('lt returns false when greater', () => {
      expect(three.lt(two)).toBe(false);
    });

    it('lte returns true when equal', () => {
      expect(two.lte(twoAgain)).toBe(true);
    });

    it('eq returns true for equal values', () => {
      expect(two.eq(twoAgain)).toBe(true);
    });

    it('eq returns false for different values', () => {
      expect(two.eq(three)).toBe(false);
    });
  });

  describe('toPercentage', () => {
    it('formats as percentage', () => {
      // 50% = 50 * ONE_COIN * 100 / ONE_COIN = ...
      // Actually, toPercentage creates Fraction(value, ONE_COIN * 100)
      // For 50%: value = 50 * ONE_COIN * 100 (= 5e12)
      // Fraction(5e12, 1e11) = 50
      const fp = FixedPointMath.from(50n * ONE_COIN * 100n);
      expect(fp.toPercentage(2)).toContain('%');
    });
  });

  describe('parseToBigInt (via from)', () => {
    it('bigint passthrough', () => {
      expect(FixedPointMath.from(42n).value()).toBe(42n);
    });

    it('number floors', () => {
      expect(FixedPointMath.from(3.7).value()).toBe(3n);
    });

    it('string parses', () => {
      expect(FixedPointMath.from('100').value()).toBe(100n);
    });

    it('invalid string defaults to 0n with warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(FixedPointMath.from('not-a-number').value()).toBe(0n);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
