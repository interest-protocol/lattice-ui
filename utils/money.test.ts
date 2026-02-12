import { describe, expect, it } from 'vitest';

import { formatDollars, formatMoney } from './money';

describe('money', () => {
  describe('formatMoney', () => {
    it('formats small numbers', () => {
      expect(formatMoney(42.567)).toBe('42.57');
    });

    it('formats thousands with K', () => {
      const result = formatMoney(1500);
      expect(result).toMatch(/1\.5K/);
    });

    it('formats millions with M', () => {
      const result = formatMoney(2_500_000);
      expect(result).toMatch(/2\.5M/);
    });

    it('respects maxDecimals', () => {
      expect(formatMoney(42.567, 0)).toBe('43');
    });

    it('formats zero', () => {
      expect(formatMoney(0)).toBe('0');
    });

    it('formats negative numbers', () => {
      const result = formatMoney(-1500);
      expect(result).toContain('1.5K');
    });

    it('defaults to 2 maxDecimals', () => {
      expect(formatMoney(1.999)).toBe('2');
    });

    it('formats with custom maxDecimals=4', () => {
      expect(formatMoney(1.12345, 4)).toBe('1.1235');
    });
  });

  describe('formatDollars', () => {
    it('includes $ prefix', () => {
      expect(formatDollars(42)).toContain('$');
    });

    it('uses compact notation for large numbers', () => {
      const result = formatDollars(1_000_000);
      expect(result).toContain('$');
      expect(result).toContain('M');
    });

    it('respects maxDecimals', () => {
      const result = formatDollars(42.567, 0);
      expect(result).toBe('$43');
    });

    it('formats zero', () => {
      expect(formatDollars(0)).toBe('$0.00');
    });
  });
});
