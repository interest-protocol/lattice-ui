import BigNumber from 'bignumber.js';

import { CurrencyAmount } from './currency-amount';
import { Fraction } from './fraction';

const MAX_BPS = new BigNumber(10000);

export class Percent extends Fraction {
  private constructor(
    numerator: BigNumber.Value,
    denominator: BigNumber.Value
  ) {
    super(numerator, denominator);
  }

  /** Create from basis points (e.g. 30 = 0.3%) */
  static fromBps(bps: number): Percent {
    return new Percent(bps, MAX_BPS);
  }

  /** Create from a percentage value (e.g. 0.3 = 0.3%) */
  static fromPercent(pct: number): Percent {
    return new Percent(new BigNumber(pct).times(100).integerValue(), MAX_BPS);
  }

  /** Apply this percentage to an amount, returning the result */
  applyTo(amount: CurrencyAmount): CurrencyAmount {
    const scaled = amount.raw
      .multipliedBy(this.numerator)
      .div(this.denominator)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);
    return CurrencyAmount.fromRawAmount(amount.token, scaled);
  }

  /**
   * Calculate fee from an amount.
   * Returns [amountAfterFee, fee] both as CurrencyAmount.
   * Fee rounds up (ceiling), so afterFee + fee >= original.
   */
  feeFrom(amount: CurrencyAmount): [CurrencyAmount, CurrencyAmount] {
    const rawValue = amount.raw.decimalPlaces(0, BigNumber.ROUND_DOWN);
    const feeRaw = rawValue.multipliedBy(this.numerator).div(this.denominator);
    const feeRounded = feeRaw.integerValue(BigNumber.ROUND_CEIL);
    const afterFee = rawValue.minus(feeRounded);

    return [
      CurrencyAmount.fromRawAmount(amount.token, afterFee),
      CurrencyAmount.fromRawAmount(amount.token, feeRounded),
    ];
  }

  /** Format as "0.30%" */
  toPercent(dp = 2): string {
    const pct = this.numerator.multipliedBy(100).div(this.denominator);
    return `${pct.toFixed(dp)}%`;
  }
}
