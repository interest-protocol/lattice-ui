import invariant from 'tiny-invariant';

import { formatUnits, parseUnits } from '@/lib/bigint-utils';

import { Fraction } from './fraction';

const ONE_COIN = 10n ** 9n;

const parseToBigInt = (value: bigint | number | string): bigint => {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(Math.trunc(value));
  try {
    return BigInt(value);
  } catch {
    console.warn(
      `FixedPointMath: cannot parse "${String(value)}" as BigInt, defaulting to 0n`
    );
    return 0n;
  }
};

type BigIntish = bigint | number | string;

export class FixedPointMath {
  private _value = 0n;

  protected constructor(_value: BigIntish) {
    this._value = parseToBigInt(_value);
  }

  private parseValue(x: BigIntish | FixedPointMath): bigint {
    if (x instanceof FixedPointMath) return x.value();
    return parseToBigInt(x);
  }

  public static from(value: BigIntish): FixedPointMath {
    return new FixedPointMath(value);
  }

  public static toBigNumber(value: number | string, decimals = 9): bigint {
    const safeValue =
      typeof value === 'number' && value > Number.MAX_SAFE_INTEGER
        ? Number.MAX_SAFE_INTEGER
        : value;

    if (safeValue == null || Number.isNaN(+safeValue)) return 0n;
    if (+safeValue < 0) {
      throw new RangeError(
        `FixedPointMath.toBigNumber received negative value: ${value}`
      );
    }

    return parseUnits(String(safeValue), decimals);
  }

  public static toNumber(
    value: bigint,
    decimals = 9,
    significant = decimals
  ): number {
    if (value === 0n) return 0;

    const num = Number(formatUnits(value, decimals));
    if (!decimals) return Math.floor(num);
    return Number(num.toPrecision(significant));
  }

  public toNumber(decimals = 9, significant = 6): number {
    return FixedPointMath.toNumber(this._value, decimals, significant);
  }

  public div(x: BigIntish | FixedPointMath): FixedPointMath {
    const divisor = this.parseValue(x);
    invariant(divisor !== 0n, 'FixedPointMath: division by zero');
    return new FixedPointMath((this._value * ONE_COIN) / divisor);
  }

  public mul(x: BigIntish | FixedPointMath): FixedPointMath {
    return new FixedPointMath((this._value * this.parseValue(x)) / ONE_COIN);
  }

  public add(x: BigIntish | FixedPointMath): FixedPointMath {
    return new FixedPointMath(this._value + this.parseValue(x));
  }

  public sub(x: BigIntish | FixedPointMath): FixedPointMath {
    return new FixedPointMath(this._value - this.parseValue(x));
  }

  public toPercentage(toSignificant = 2): string {
    const fraction = Fraction.from(this._value, ONE_COIN * 100n);
    return `${fraction.toSignificant(toSignificant || 1)} %`;
  }

  public gt(x: BigIntish | FixedPointMath): boolean {
    return this._value > this.parseValue(x);
  }

  public gte(x: BigIntish | FixedPointMath): boolean {
    return this._value >= this.parseValue(x);
  }

  public lt(x: BigIntish | FixedPointMath): boolean {
    return this._value < this.parseValue(x);
  }

  public lte(x: BigIntish | FixedPointMath): boolean {
    return this._value <= this.parseValue(x);
  }

  public eq(x: BigIntish | FixedPointMath): boolean {
    return this._value === this.parseValue(x);
  }

  public value(): bigint {
    return this._value;
  }
}
