import BigNumber from 'bignumber.js';

import type { BigNumberish } from '@/interface';
import { parseBigNumberish } from '@/utils';

import { FixedPointMath } from './fixed-point-math';
import { Fraction } from './fraction';
import type { Token } from './token';

export class CurrencyAmount {
  readonly token: Token;
  readonly raw: BigNumber;

  private constructor(token: Token, raw: BigNumber) {
    this.token = token;
    this.raw = raw;
  }

  // --- Factories ---

  static fromRawAmount(token: Token, raw: BigNumberish): CurrencyAmount {
    return new CurrencyAmount(token, parseBigNumberish(raw));
  }

  static fromHumanAmount(
    token: Token,
    humanAmount: string | number
  ): CurrencyAmount {
    const raw = FixedPointMath.toBigNumber(
      typeof humanAmount === 'string' ? Number(humanAmount) || 0 : humanAmount,
      token.decimals
    );
    return new CurrencyAmount(token, raw);
  }

  static zero(token: Token): CurrencyAmount {
    return new CurrencyAmount(token, new BigNumber(0));
  }

  // --- Display ---

  toExact(): string {
    return Fraction.from(
      this.raw,
      new BigNumber(10).pow(this.token.decimals)
    ).toSignificant(this.token.decimals, { groupSeparator: '' });
  }

  toFixed(dp = 4): string {
    const num = this.toNumber();
    return num.toFixed(dp);
  }

  toSignificant(sig = 6): string {
    return Fraction.from(
      this.raw,
      new BigNumber(10).pow(this.token.decimals)
    ).toSignificant(sig, { groupSeparator: '' });
  }

  toNumber(): number {
    return FixedPointMath.toNumber(this.raw, this.token.decimals);
  }

  // --- Arithmetic (returns new CurrencyAmount, same token) ---

  add(other: CurrencyAmount): CurrencyAmount {
    this.assertSameToken(other);
    return new CurrencyAmount(this.token, this.raw.plus(other.raw));
  }

  subtract(other: CurrencyAmount): CurrencyAmount {
    this.assertSameToken(other);
    return new CurrencyAmount(this.token, this.raw.minus(other.raw));
  }

  multiply(other: BigNumberish): CurrencyAmount {
    const factor = parseBigNumberish(other);
    return new CurrencyAmount(
      this.token,
      this.raw.multipliedBy(factor).decimalPlaces(0, BigNumber.ROUND_DOWN)
    );
  }

  // --- Comparisons ---

  greaterThan(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw.gt(other.raw);
  }

  lessThan(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw.lt(other.raw);
  }

  equalTo(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw.eq(other.raw);
  }

  isZero(): boolean {
    return this.raw.isZero();
  }

  isPositive(): boolean {
    return this.raw.gt(0);
  }

  exceedsBalance(balance: CurrencyAmount): boolean {
    this.assertSameToken(balance);
    return this.raw.gt(balance.raw);
  }

  // --- Internal ---

  private assertSameToken(other: CurrencyAmount): void {
    if (!this.token.equals(other.token)) {
      throw new Error(
        `Token mismatch: ${this.token.symbol} vs ${other.token.symbol}`
      );
    }
  }
}
