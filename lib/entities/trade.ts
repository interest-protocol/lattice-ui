import invariant from 'tiny-invariant';

import { parseUnits } from '@/lib/bigint-utils';

import { CurrencyAmount } from './currency-amount';
import { Fraction } from './fraction';
import { Percent } from './percent';
import type { Token } from './token';

const DEFAULT_SLIPPAGE = Percent.fromBps(50);

const PRICE_SCALE_DECIMALS = 18;
const PRICE_SCALE = 10n ** BigInt(PRICE_SCALE_DECIMALS);

interface TradeParams {
  inputAmount: CurrencyAmount;
  outputToken: Token;
  inputPriceUsd: number;
  outputPriceUsd: number;
  slippage?: Percent;
}

export class Trade {
  readonly inputAmount: CurrencyAmount;
  readonly expectedOutput: CurrencyAmount;
  readonly minimumReceived: CurrencyAmount;
  readonly slippage: Percent;
  readonly rateFraction: Fraction;

  private constructor(
    inputAmount: CurrencyAmount,
    expectedOutput: CurrencyAmount,
    minimumReceived: CurrencyAmount,
    slippage: Percent,
    rateFraction: Fraction
  ) {
    this.inputAmount = inputAmount;
    this.expectedOutput = expectedOutput;
    this.minimumReceived = minimumReceived;
    this.slippage = slippage;
    this.rateFraction = rateFraction;
  }

  static fromOraclePrices({
    inputAmount,
    outputToken,
    inputPriceUsd,
    outputPriceUsd,
    slippage = DEFAULT_SLIPPAGE,
  }: TradeParams): Trade {
    invariant(inputPriceUsd > 0, 'Input price must be positive');
    invariant(outputPriceUsd > 0, 'Output price must be positive');

    const inputPriceScaled = parseUnits(
      String(inputPriceUsd),
      PRICE_SCALE_DECIMALS
    );
    const outputPriceScaled = parseUnits(
      String(outputPriceUsd),
      PRICE_SCALE_DECIMALS
    );

    const rateFraction = Fraction.from(inputPriceScaled, outputPriceScaled);

    const inputDecimals = BigInt(inputAmount.token.decimals);
    const outputDecimals = BigInt(outputToken.decimals);
    const outputRaw =
      (inputAmount.raw * inputPriceScaled * 10n ** outputDecimals) /
      (outputPriceScaled * 10n ** inputDecimals);

    const expectedOutput = CurrencyAmount.fromRawAmount(outputToken, outputRaw);
    const slippageAmount = slippage.applyTo(expectedOutput);
    const minimumReceived = expectedOutput.subtract(slippageAmount);

    return new Trade(
      inputAmount,
      expectedOutput,
      minimumReceived,
      slippage,
      rateFraction
    );
  }

  get rate(): number {
    return (
      Number(this.rateFraction.numerator) /
      Number(this.rateFraction.denominator)
    );
  }

  get route(): string {
    return `${this.inputAmount.token.symbol} → ${this.expectedOutput.token.symbol}`;
  }

  get rateDisplay(): string {
    return `1 ${this.inputAmount.token.symbol} ≈ ${this.rateFraction.toSignificant(6)} ${this.expectedOutput.token.symbol}`;
  }
}
