export enum Rounding {
  ROUND_DOWN = 0,
  ROUND_HALF_UP = 1,
  ROUND_UP = 2,
}

export type BigIntish = bigint | number | string;

const toBigInt = (value: BigIntish): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  return BigInt(value);
};

export class Fraction {
  public readonly numerator: bigint;
  public readonly denominator: bigint;

  public constructor(numerator: BigIntish, denominator: BigIntish = 1n) {
    this.numerator = toBigInt(numerator);
    this.denominator = toBigInt(denominator);
    if (this.denominator === 0n) {
      throw new Error('Fraction: denominator must not be zero');
    }
  }

  public get quotient(): bigint {
    return this.numerator / this.denominator;
  }

  public get remainder(): Fraction {
    return new Fraction(this.numerator % this.denominator, this.denominator);
  }

  public invert(): Fraction {
    return new Fraction(this.denominator, this.numerator);
  }

  public static from(
    numerator: BigIntish,
    denominator: BigIntish = 1n
  ): Fraction {
    return new Fraction(numerator, denominator);
  }

  private static tryParseFraction(fractionish: BigIntish | Fraction): Fraction {
    if (fractionish instanceof Fraction) return fractionish;

    if (
      typeof fractionish === 'bigint' ||
      typeof fractionish === 'number' ||
      typeof fractionish === 'string'
    )
      return new Fraction(fractionish);

    throw new Error('Could not parse fraction');
  }

  public plus(other: Fraction | BigIntish): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    if (otherParsed.denominator === this.denominator)
      return new Fraction(
        this.numerator + otherParsed.numerator,
        otherParsed.denominator
      );

    return new Fraction(
      this.numerator * otherParsed.denominator +
        this.denominator * otherParsed.numerator,
      this.denominator * otherParsed.denominator
    );
  }

  public subtract(other: Fraction | BigIntish): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    if (otherParsed.denominator === this.denominator)
      return new Fraction(
        this.numerator - otherParsed.numerator,
        otherParsed.denominator
      );

    return new Fraction(
      this.numerator * otherParsed.denominator -
        this.denominator * otherParsed.numerator,
      this.denominator * otherParsed.denominator
    );
  }

  public lessThan(other: Fraction | BigIntish): boolean {
    const otherParsed = Fraction.tryParseFraction(other);
    return (
      this.numerator * otherParsed.denominator <
      otherParsed.numerator * this.denominator
    );
  }

  public equalTo(other: Fraction | BigIntish): boolean {
    const otherParsed = Fraction.tryParseFraction(other);
    return (
      this.numerator * otherParsed.denominator ===
      otherParsed.numerator * this.denominator
    );
  }

  public divide(other: Fraction | BigIntish): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    return new Fraction(
      this.numerator * otherParsed.denominator,
      this.denominator * otherParsed.numerator
    );
  }

  public multiply(other: Fraction | BigIntish): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    return new Fraction(
      this.numerator * otherParsed.numerator,
      this.denominator * otherParsed.denominator
    );
  }

  /**
   * Performs bigint-based decimal division to avoid Number precision loss
   * for values exceeding Number.MAX_SAFE_INTEGER.
   */
  private toBigIntDecimal(decimalPlaces: number): string {
    const negative = this.numerator < 0n;
    const abs = negative ? -this.numerator : this.numerator;
    const scale = 10n ** BigInt(decimalPlaces);
    const scaled = (abs * scale) / this.denominator;
    const intPart = scaled / scale;
    const fracPart = scaled % scale;
    const fracStr = fracPart.toString().padStart(decimalPlaces, '0');
    const sign = negative ? '-' : '';
    if (decimalPlaces === 0) return `${sign}${intPart}`;
    return `${sign}${intPart}.${fracStr}`;
  }

  public toSignificant(
    significantDigits: number,
    rounding: Rounding = Rounding.ROUND_HALF_UP
  ): string {
    // Use bigint-safe path for large values
    const safeDecimalPlaces = significantDigits + 4;
    const raw = this.toBigIntDecimal(safeDecimalPlaces);
    const num = Number(raw);

    const result = num.toPrecision(significantDigits);

    if (rounding === Rounding.ROUND_DOWN) {
      const factor =
        10 **
        (significantDigits - 1 - Math.floor(Math.log10(Math.abs(num) || 1)));
      const truncated = Math.trunc(num * factor) / factor;
      return truncated.toPrecision(significantDigits).replace(/\.?0+$/, '');
    }
    if (rounding === Rounding.ROUND_UP) {
      const factor =
        10 **
        (significantDigits - 1 - Math.floor(Math.log10(Math.abs(num) || 1)));
      const ceiled =
        num >= 0
          ? Math.ceil(num * factor) / factor
          : Math.floor(num * factor) / factor;
      return ceiled.toPrecision(significantDigits).replace(/\.?0+$/, '');
    }

    return result.replace(/\.?0+$/, '');
  }

  public toFixed(
    decimalPlaces: number,
    options?: Intl.NumberFormatOptions
  ): string {
    const raw = this.toBigIntDecimal(decimalPlaces);
    return new Intl.NumberFormat('en-US', options).format(Number(raw));
  }
}
