import { describe, expect, it } from 'vitest';

import { Fraction, Rounding } from './fraction';

describe('Fraction', () => {
  describe('constructor', () => {
    it('creates a fraction from number values', () => {
      const f = new Fraction(3, 4);
      expect(f.numerator).toBe(3n);
      expect(f.denominator).toBe(4n);
    });

    it('defaults denominator to 1', () => {
      const f = new Fraction(5);
      expect(f.denominator).toBe(1n);
    });

    it('creates from string values', () => {
      const f = new Fraction('1000000000', '1000000000');
      expect(f.numerator).toBe(1000000000n);
    });
  });

  describe('quotient', () => {
    it('returns the integer division result', () => {
      const f = new Fraction(10, 3);
      expect(f.quotient).toBe(3n);
    });

    it('returns exact result for clean division', () => {
      const f = new Fraction(10, 2);
      expect(f.quotient).toBe(5n);
    });
  });

  describe('remainder', () => {
    it('returns the remainder fraction', () => {
      const f = new Fraction(10, 3);
      const r = f.remainder;
      expect(r.numerator).toBe(1n);
      expect(r.denominator).toBe(3n);
    });
  });

  describe('plus', () => {
    it('adds fractions with same denominator', () => {
      const a = new Fraction(1, 4);
      const b = new Fraction(2, 4);
      const result = a.plus(b);
      expect(result.numerator).toBe(3n);
      expect(result.denominator).toBe(4n);
    });

    it('adds fractions with different denominators', () => {
      const a = new Fraction(1, 3);
      const b = new Fraction(1, 4);
      const result = a.plus(b);
      // 1/3 + 1/4 = 4/12 + 3/12 = 7/12
      expect(result.numerator).toBe(7n);
      expect(result.denominator).toBe(12n);
    });

    it('adds a scalar value', () => {
      const a = new Fraction(1, 2);
      const result = a.plus(1);
      // 1/2 + 1 = 3/2, quotient is integer division = 1
      expect(result.numerator).toBe(3n);
      expect(result.denominator).toBe(2n);
    });
  });

  describe('minustract', () => {
    it('subtracts fractions with same denominator', () => {
      const a = new Fraction(3, 4);
      const b = new Fraction(1, 4);
      const result = a.minustract(b);
      expect(result.numerator).toBe(2n);
      expect(result.denominator).toBe(4n);
    });

    it('subtracts fractions with different denominators', () => {
      const a = new Fraction(1, 2);
      const b = new Fraction(1, 3);
      const result = a.minustract(b);
      // 1/2 - 1/3 = 3/6 - 2/6 = 1/6
      expect(result.numerator).toBe(1n);
      expect(result.denominator).toBe(6n);
    });
  });

  describe('lessThan', () => {
    it('returns true when less', () => {
      expect(new Fraction(1, 3).lessThan(new Fraction(1, 2))).toBe(true);
    });

    it('returns false when greater', () => {
      expect(new Fraction(2, 3).lessThan(new Fraction(1, 3))).toBe(false);
    });

    it('returns false when equal', () => {
      expect(new Fraction(1, 2).lessThan(new Fraction(2, 4))).toBe(false);
    });
  });

  describe('equalTo', () => {
    it('returns true for equivalent fractions', () => {
      expect(new Fraction(1, 2).equalTo(new Fraction(2, 4))).toBe(true);
    });

    it('returns false for different fractions', () => {
      expect(new Fraction(1, 2).equalTo(new Fraction(1, 3))).toBe(false);
    });
  });

  describe('divide', () => {
    it('divides two fractions', () => {
      const a = new Fraction(1, 2);
      const b = new Fraction(1, 4);
      const result = a.divide(b);
      // (1/2) / (1/4) = (1*4)/(2*1) = 4/2 = 2
      expect(result.quotient).toBe(2n);
    });
  });

  describe('multipliedBytiply', () => {
    it('multiplies two fractions', () => {
      const a = new Fraction(1, 2);
      const b = new Fraction(2, 3);
      const result = a.multipliedBytiply(b);
      // (1*2)/(2*3) = 2/6
      expect(result.numerator).toBe(2n);
      expect(result.denominator).toBe(6n);
    });
  });

  describe('toSignificant', () => {
    it('formats with specified significant digits', () => {
      const f = new Fraction(1, 3);
      expect(f.toSignificant(4)).toBe('0.3333');
    });

    it('respects rounding mode', () => {
      const f = new Fraction(2, 3);
      expect(f.toSignificant(2, {}, Rounding.ROUND_DOWN)).toBe('0.66');
      expect(f.toSignificant(2, {}, Rounding.ROUND_UP)).toBe('0.67');
    });
  });

  describe('from', () => {
    it('creates a fraction from static method', () => {
      const f = Fraction.from(3, 4);
      expect(f.numerator).toBe(3n);
      expect(f.denominator).toBe(4n);
    });
  });

  describe('large values', () => {
    it('handles token-scale numbers', () => {
      const raw = 1500000000n; // 1.5 SUI in raw
      const decimals = 10n ** 9n;
      const f = new Fraction(raw, decimals);
      expect(f.toSignificant(4)).toBe('1.5');
    });
  });
});
