import { CurrencyAmount } from './currency-amount';
import { type BigIntish, Fraction } from './fraction';

const MAX_BPS = 10000n;

export class Percent extends Fraction {
  private constructor(numerator: BigIntish, denominator: BigIntish) {
    super(numerator, denominator);
  }

  static fromBps(bps: number): Percent {
    return new Percent(BigInt(bps), MAX_BPS);
  }

  static fromPercent(pct: number): Percent {
    return new Percent(BigInt(Math.round(pct * 100)), MAX_BPS);
  }

  applyTo(amount: CurrencyAmount): CurrencyAmount {
    const scaled = (amount.raw * this.numerator) / this.denominator;
    return CurrencyAmount.fromRawAmount(amount.token, scaled);
  }

  feeFrom(amount: CurrencyAmount): [CurrencyAmount, CurrencyAmount] {
    const rawValue = amount.raw;
    const feeTimesBase = rawValue * this.numerator;
    const feeRaw = feeTimesBase / this.denominator;
    const feeRounded =
      feeTimesBase % this.denominator > 0n ? feeRaw + 1n : feeRaw;
    const afterFee = rawValue - feeRounded;

    return [
      CurrencyAmount.fromRawAmount(amount.token, afterFee),
      CurrencyAmount.fromRawAmount(amount.token, feeRounded),
    ];
  }

  toPercent(dp = 2): string {
    const pct = (Number(this.numerator) * 100) / Number(this.denominator);
    return `${pct.toFixed(dp)}%`;
  }
}
