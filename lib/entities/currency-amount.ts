import invariant from 'tiny-invariant';

import { parseUnits, toSignificant } from '@/utils/bigint';

import { FixedPointMath } from './fixed-point-math';
import { type BigIntish, Fraction, toBigInt } from './fraction';
import type { Token } from './token';

// u256 max — well beyond any realistic token supply
const MAX_SAFE_AMOUNT = (1n << 128n) - 1n;

export class CurrencyAmount {
  readonly token: Token;
  readonly raw: bigint;

  private constructor(token: Token, raw: bigint) {
    this.token = token;
    this.raw = raw;
  }

  static fromRawAmount(token: Token, raw: BigIntish): CurrencyAmount {
    return new CurrencyAmount(token, toBigInt(raw));
  }

  static fromHumanAmount(
    token: Token,
    humanAmount: string | number
  ): CurrencyAmount {
    const str =
      typeof humanAmount === 'number' ? String(humanAmount) : humanAmount;
    const raw = parseUnits(str || '0', token.decimals);
    return new CurrencyAmount(token, raw);
  }

  static zero(token: Token): CurrencyAmount {
    return new CurrencyAmount(token, 0n);
  }

  toExact(): string {
    return Fraction.from(
      this.raw,
      10n ** BigInt(this.token.decimals)
    ).toSignificant(this.token.decimals);
  }

  toFixed(dp = 4): string {
    const num = this.toNumber();
    return num.toFixed(dp);
  }

  toSignificant(sig = 6): string {
    return toSignificant(this.raw, this.token.decimals, sig);
  }

  toNumber(): number {
    return FixedPointMath.toNumber(this.raw, this.token.decimals);
  }

  add(other: CurrencyAmount): CurrencyAmount {
    this.assertSameToken(other);
    return new CurrencyAmount(this.token, this.raw + other.raw);
  }

  subtract(other: CurrencyAmount): CurrencyAmount {
    this.assertSameToken(other);
    return new CurrencyAmount(this.token, this.raw - other.raw);
  }

  multiply(other: BigIntish): CurrencyAmount {
    const factor = toBigInt(other);
    invariant(factor >= 0n, 'Cannot multiply by negative factor');
    const result = this.raw * factor;
    invariant(
      result <= MAX_SAFE_AMOUNT,
      'Multiplication overflow: result exceeds safe amount'
    );
    return new CurrencyAmount(this.token, result);
  }

  greaterThan(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw > other.raw;
  }

  lessThan(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw < other.raw;
  }

  equalTo(other: CurrencyAmount): boolean {
    this.assertSameToken(other);
    return this.raw === other.raw;
  }

  isZero(): boolean {
    return this.raw === 0n;
  }

  isPositive(): boolean {
    return this.raw > 0n;
  }

  exceedsBalance(balance: CurrencyAmount): boolean {
    this.assertSameToken(balance);
    return this.raw > balance.raw;
  }

  private assertSameToken(other: CurrencyAmount): void {
    invariant(
      this.token.equals(other.token),
      `Token mismatch: ${this.token.symbol} vs ${other.token.symbol}`
    );
  }
}
