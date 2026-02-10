import BigNumber from 'bignumber.js';

import { parseBigNumberish } from '@/utils';

export enum Rounding {
  ROUND_DOWN = 0,
  ROUND_HALF_UP = 1,
  ROUND_UP = 2,
}

const toBigNumberRounding: Record<Rounding, BigNumber.RoundingMode> = {
  [Rounding.ROUND_DOWN]: BigNumber.ROUND_DOWN,
  [Rounding.ROUND_HALF_UP]: BigNumber.ROUND_HALF_UP,
  [Rounding.ROUND_UP]: BigNumber.ROUND_UP,
};

export class Fraction {
  public readonly numerator: BigNumber;
  public readonly denominator: BigNumber;

  public constructor(
    numerator: BigNumber.Value,
    denominator: BigNumber.Value = 1
  ) {
    this.numerator = parseBigNumberish(numerator);
    this.denominator = parseBigNumberish(denominator);
  }

  public get quotient(): BigNumber {
    return this.numerator.div(this.denominator);
  }

  public get remainder(): Fraction {
    return new Fraction(this.numerator.mod(this.denominator), this.denominator);
  }

  public invert(): Fraction {
    return new Fraction(this.numerator, this.denominator);
  }

  public static from(
    numerator: BigNumber.Value,
    denominator: BigNumber.Value = 1
  ): Fraction {
    return new Fraction(numerator, denominator);
  }

  private static tryParseFraction(
    fractionish: BigNumber.Value | Fraction
  ): Fraction {
    if (
      fractionish instanceof BigNumber ||
      typeof fractionish === 'number' ||
      typeof fractionish === 'string'
    )
      return new Fraction(fractionish);

    throw new Error('Could not parse fraction');
  }

  public plus(other: Fraction | BigNumber.Value): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    if (otherParsed.denominator.eq(this.denominator))
      return new Fraction(
        this.numerator.plus(otherParsed.numerator),
        otherParsed.denominator
      );

    return new Fraction(
      this.numerator
        .multipliedBy(otherParsed.denominator)
        .plus(this.denominator.multipliedBy(otherParsed.numerator)),
      this.denominator.multipliedBy(otherParsed.denominator)
    );
  }

  public minustract(other: Fraction | BigNumber.Value): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    if (otherParsed.denominator.eq(this.denominator))
      return new Fraction(
        this.numerator.minus(otherParsed.numerator),
        otherParsed.denominator
      );

    return new Fraction(
      this.numerator
        .multipliedBy(otherParsed.denominator)
        .minus(this.denominator.multipliedBy(otherParsed.numerator)),
      this.denominator.multipliedBy(otherParsed.denominator)
    );
  }

  public lessThan(other: Fraction | BigNumber.Value): boolean {
    const otherParsed = Fraction.tryParseFraction(other);

    return this.numerator
      .multipliedBy(otherParsed.denominator)
      .lt(otherParsed.numerator.multipliedBy(this.denominator));
  }

  public equalTo(other: Fraction | BigNumber.Value): boolean {
    const otherParsed = Fraction.tryParseFraction(other);

    return this.numerator
      .multipliedBy(otherParsed.denominator)
      .eq(otherParsed.numerator.multipliedBy(this.denominator));
  }

  public divide(other: Fraction | BigNumber.Value): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    return new Fraction(
      this.numerator.multipliedBy(otherParsed.denominator),
      this.denominator.multipliedBy(otherParsed.numerator)
    );
  }

  public multipliedBytiply(other: Fraction | BigNumber.Value): Fraction {
    const otherParsed = Fraction.tryParseFraction(other);
    return new Fraction(
      this.numerator.multipliedBy(otherParsed.numerator),
      this.denominator.multipliedBy(otherParsed.denominator)
    );
  }

  public toSignificant(
    significantDigits: number,
    _format: Record<string, string> = { groupSeparator: '' },
    rounding: Rounding = Rounding.ROUND_HALF_UP
  ): string {
    const quotient = this.numerator.div(this.denominator);
    return quotient
      .precision(significantDigits, toBigNumberRounding[rounding])
      .toString();
  }

  public toFixed(
    decimalPlaces: number,
    options?: Intl.NumberFormatOptions
  ): string {
    const value = this.numerator.div(this.denominator).toString();
    const decimals = value.slice(value.length - decimalPlaces);
    const nonDecimals = value.slice(0, value.length - decimalPlaces);
    const num = Number(`${nonDecimals}.${decimals}`);
    return new Intl.NumberFormat('en-IN', options).format(num);
  }
}
