import BigNumber from 'bignumber.js';

import { CurrencyAmount } from './currency-amount';
import { Fraction } from './fraction';
import type { Token } from './token';

export class Price {
  readonly baseToken: Token;
  readonly quoteToken: Token;
  readonly rate: Fraction;

  constructor(baseToken: Token, quoteToken: Token, rate: Fraction) {
    this.baseToken = baseToken;
    this.quoteToken = quoteToken;
    this.rate = rate;
  }

  static fromHumanRate(base: Token, quote: Token, rate: number): Price {
    const scaledRate = new BigNumber(rate).times(
      new BigNumber(10).pow(quote.decimals)
    );
    return new Price(
      base,
      quote,
      new Fraction(scaledRate, new BigNumber(10).pow(base.decimals))
    );
  }

  invert(): Price {
    return new Price(
      this.quoteToken,
      this.baseToken,
      new Fraction(this.rate.denominator, this.rate.numerator)
    );
  }

  quote(amount: CurrencyAmount): CurrencyAmount {
    if (!amount.token.equals(this.baseToken)) {
      throw new Error(
        `Price.quote expects ${this.baseToken.symbol}, got ${amount.token.symbol}`
      );
    }
    const rawQuote = amount.raw
      .multipliedBy(this.rate.numerator)
      .div(this.rate.denominator)
      .decimalPlaces(0, BigNumber.ROUND_DOWN);
    return CurrencyAmount.fromRawAmount(this.quoteToken, rawQuote);
  }

  toFixed(dp = 4): string {
    return this.rate.quotient.toFixed(dp);
  }

  toSignificant(sig = 6): string {
    return this.rate.toSignificant(sig);
  }
}
