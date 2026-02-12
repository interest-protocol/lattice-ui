import { describe, expect, it } from 'vitest';

import {
  bigintAbs,
  bigintDivDown,
  bigintDivUp,
  formatUnits,
  parseUnits,
  toFixed,
  toSignificant,
} from './bigint-utils';

describe('bigint-utils', () => {
  describe('formatUnits', () => {
    it('formats 1.5 SUI correctly (9 decimals)', () => {
      expect(formatUnits(1_500_000_000n, 9)).toBe('1.5');
    });

    it('formats zero', () => {
      expect(formatUnits(0n, 9)).toBe('0');
    });

    it('formats the smallest unit', () => {
      expect(formatUnits(1n, 9)).toBe('0.000000001');
    });

    it('strips trailing zeros', () => {
      expect(formatUnits(1_000_000_000n, 9)).toBe('1');
    });

    it('formats negative values', () => {
      expect(formatUnits(-1_500_000_000n, 9)).toBe('-1.5');
    });

    it('formats large values', () => {
      expect(formatUnits(999_999_999_999_999_999n, 9)).toBe('999999999.999999999');
    });

    it('formats with 6 decimals', () => {
      expect(formatUnits(1_500_000n, 6)).toBe('1.5');
    });

    it('formats with 18 decimals', () => {
      expect(formatUnits(1_500_000_000_000_000_000n, 18)).toBe('1.5');
    });
  });

  describe('parseUnits', () => {
    it('parses "1.5" with 9 decimals', () => {
      expect(parseUnits('1.5', 9)).toBe(1_500_000_000n);
    });

    it('parses "0" to 0n', () => {
      expect(parseUnits('0', 9)).toBe(0n);
    });

    it('returns 0n for empty string', () => {
      expect(parseUnits('', 9)).toBe(0n);
    });

    it('parses integer without decimal', () => {
      expect(parseUnits('42', 9)).toBe(42_000_000_000n);
    });

    it('truncates excess decimals', () => {
      // "1.1234567891" has 10 decimal places, should truncate to 9
      expect(parseUnits('1.1234567891', 9)).toBe(1_123_456_789n);
    });

    it('parses negative values', () => {
      expect(parseUnits('-1.5', 9)).toBe(-1_500_000_000n);
    });

    it('roundtrips with formatUnits', () => {
      const original = '3.141592653';
      const raw = parseUnits(original, 9);
      const formatted = formatUnits(raw, 9);
      expect(formatted).toBe(original);
    });

    it('parses with 6 decimals', () => {
      expect(parseUnits('1.5', 6)).toBe(1_500_000n);
    });

    it('parses with 18 decimals', () => {
      expect(parseUnits('1.5', 18)).toBe(1_500_000_000_000_000_000n);
    });

    it('roundtrips negative values with formatUnits', () => {
      const original = '-2.5';
      const raw = parseUnits(original, 9);
      const formatted = formatUnits(raw, 9);
      expect(formatted).toBe(original);
    });
  });

  describe('toFixed', () => {
    it('formats with specified decimal places', () => {
      expect(toFixed(1_500_000_000n, 9, 4)).toBe('1.5000');
    });

    it('zero-pads short fractions', () => {
      expect(toFixed(1_000_000_000n, 9, 2)).toBe('1.00');
    });

    it('truncates long fractions', () => {
      expect(toFixed(1_234_567_891n, 9, 3)).toBe('1.234');
    });

    it('returns integer when dp=0', () => {
      expect(toFixed(1_500_000_000n, 9, 0)).toBe('1');
    });
  });

  describe('toSignificant', () => {
    it('formats with specified significant digits', () => {
      expect(toSignificant(1_500_000_000n, 9, 4)).toBe('1.5');
    });

    it('strips trailing zeros', () => {
      const result = toSignificant(1_000_000_000n, 9, 6);
      expect(result).toBe('1');
    });

    it('handles zero', () => {
      // 0 → toPrecision returns "0.00000" → stripped to "0"
      expect(toSignificant(0n, 9, 4)).toBe('0');
    });

    it('formats small fractional values', () => {
      // 0.001 SUI = 1_000_000 raw
      const result = toSignificant(1_000_000n, 9, 3);
      expect(result).toBe('0.001');
    });
  });

  describe('bigintAbs', () => {
    it('returns positive as-is', () => {
      expect(bigintAbs(42n)).toBe(42n);
    });

    it('negates negative', () => {
      expect(bigintAbs(-42n)).toBe(42n);
    });

    it('returns zero for zero', () => {
      expect(bigintAbs(0n)).toBe(0n);
    });
  });

  describe('bigintDivDown', () => {
    it('floors division (7/2 = 3)', () => {
      expect(bigintDivDown(7n, 2n)).toBe(3n);
    });

    it('returns exact for clean division (6/2 = 3)', () => {
      expect(bigintDivDown(6n, 2n)).toBe(3n);
    });
  });

  describe('bigintDivUp', () => {
    it('ceils division (7/2 = 4)', () => {
      expect(bigintDivUp(7n, 2n)).toBe(4n);
    });

    it('returns exact for clean division (6/2 = 3)', () => {
      expect(bigintDivUp(6n, 2n)).toBe(3n);
    });

    it('throws on division by zero', () => {
      expect(() => bigintDivUp(7n, 0n)).toThrow('Division by zero');
    });
  });
});
