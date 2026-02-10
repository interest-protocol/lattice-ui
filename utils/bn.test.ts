import { describe, expect, it } from 'vitest';

import {
  feesCalcUp,
  isBigNumberish,
  isHexString,
  parseBigNumberish,
  parseToPositiveStringNumber,
  ZERO_BIG_INT,
  ZERO_BIG_NUMBER,
} from './bn';

describe('bn utilities', () => {
  describe('ZERO_BIG_INT / ZERO_BIG_NUMBER', () => {
    it('is zero', () => {
      expect(ZERO_BIG_INT).toBe(0n);
      expect(ZERO_BIG_NUMBER).toBe(0n);
    });
  });

  describe('isHexString', () => {
    it('recognizes valid hex strings', () => {
      expect(isHexString('0x0')).toBe(true);
      expect(isHexString('0xAbCdEf')).toBe(true);
      expect(isHexString('0x1234567890abcdef')).toBe(true);
    });

    it('rejects invalid hex strings', () => {
      expect(isHexString('0xGHIJ')).toBe(false);
      expect(isHexString('1234')).toBe(false);
      expect(isHexString('')).toBe(false);
      expect(isHexString(123)).toBe(false);
    });

    it('validates length when specified', () => {
      expect(isHexString('0x0a', 1)).toBe(true);
      expect(isHexString('0x0a', 2)).toBe(false);
    });
  });

  describe('isBigNumberish', () => {
    it('accepts bigint values', () => {
      expect(isBigNumberish(5n)).toBe(true);
    });

    it('accepts integers', () => {
      expect(isBigNumberish(42)).toBe(true);
      expect(isBigNumberish(0)).toBe(true);
    });

    it('rejects non-integer numbers', () => {
      expect(isBigNumberish(1.5)).toBe(false);
    });

    it('accepts numeric strings', () => {
      expect(isBigNumberish('123')).toBe(true);
      expect(isBigNumberish('-456')).toBe(true);
    });

    it('rejects non-numeric strings', () => {
      expect(isBigNumberish('hello')).toBe(false);
    });

    it('accepts bigint', () => {
      expect(isBigNumberish(BigInt(100))).toBe(true);
    });

    it('accepts hex strings', () => {
      expect(isBigNumberish('0xff')).toBe(true);
    });

    it('rejects null and undefined', () => {
      expect(isBigNumberish(null)).toBe(false);
      expect(isBigNumberish(undefined)).toBe(false);
    });
  });

  describe('parseBigNumberish', () => {
    it('parses numbers', () => {
      expect(parseBigNumberish(42)).toBe(42n);
    });

    it('parses strings', () => {
      expect(parseBigNumberish('1000000000')).toBe(1000000000n);
    });

    it('parses bigint', () => {
      expect(parseBigNumberish(99n)).toBe(99n);
    });

    it('returns zero for null', () => {
      expect(parseBigNumberish(null)).toBe(0n);
    });

    it('returns zero for undefined', () => {
      expect(parseBigNumberish(undefined)).toBe(0n);
    });

    it('returns zero for NaN string', () => {
      expect(parseBigNumberish('not-a-number')).toBe(0n);
    });

    it('returns zero for Infinity', () => {
      expect(parseBigNumberish('Infinity')).toBe(0n);
    });
  });

  describe('parseToPositiveStringNumber', () => {
    it('returns valid positive numbers unchanged', () => {
      expect(parseToPositiveStringNumber('42')).toBe('42');
      expect(parseToPositiveStringNumber('1.5')).toBe('1.5');
    });

    it('returns "0" for negative numbers', () => {
      expect(parseToPositiveStringNumber('-5')).toBe('0');
    });

    it('returns "0" for NaN', () => {
      expect(parseToPositiveStringNumber('hello')).toBe('0');
    });
  });

  describe('feesCalcUp', () => {
    it('calculates fees correctly for standard amount', () => {
      // 30 bps (0.3%) on 1000000000 (1 SUI)
      const amount = 1000000000n;
      const [afterFee, fee] = feesCalcUp(30, amount);

      // 30 / 10000 * 1000000000 = 3000000
      expect(fee).toBe(3000000n);
      expect(afterFee).toBe(997000000n);
    });

    it('rounds fees up when there is a remainder', () => {
      // 30 bps on 1000000001 - should round up
      const amount = 1000000001n;
      const [afterFee, fee] = feesCalcUp(30, amount);

      // fee * value = 30 * 1000000001 = 30000000030
      // 30000000030 / 10000 = 3000000 remainder 30
      // Since remainder > 0, fee = 3000001
      expect(fee).toBe(3000001n);
      expect(afterFee).toBe(997000000n);
    });

    it('handles zero fee', () => {
      const amount = 1000000000n;
      const [afterFee, fee] = feesCalcUp(0, amount);

      expect(fee).toBe(0n);
      expect(afterFee).toBe(1000000000n);
    });

    it('handles small amounts', () => {
      const amount = 100n;
      const [afterFee, fee] = feesCalcUp(30, amount);

      // 30 * 100 / 10000 = 0.3 → rounds up to 1
      expect(fee >= 0n).toBe(true);
      expect(afterFee + fee >= amount).toBe(true);
    });

    it('afterFee + fee always >= original amount', () => {
      const testAmounts = [1n, 100n, 999n, 1000000000n, 999999999999n];
      const testFees = [1, 10, 30, 100, 9999];

      for (const amount of testAmounts) {
        for (const bps of testFees) {
          const [afterFee, fee] = feesCalcUp(bps, amount);
          expect(afterFee + fee >= amount).toBe(true);
        }
      }
    });
  });
});
