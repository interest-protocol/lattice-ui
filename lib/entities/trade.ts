import invariant from 'tiny-invariant';

import { CurrencyAmount } from './currency-amount';
import { Percent } from './percent';
import type { Token } from './token';

const DEFAULT_SLIPPAGE = Percent.fromBps(50); // 0.5%

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
  readonly rate: number;

  private constructor(
    inputAmount: CurrencyAmount,
    expectedOutput: CurrencyAmount,
    minimumReceived: CurrencyAmount,
    slippage: Percent,
    rate: number
  ) {
    this.inputAmount = inputAmount;
    this.expectedOutput = expectedOutput;
    this.minimumReceived = minimumReceived;
    this.slippage = slippage;
    this.rate = rate;
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

    const rate = inputPriceUsd / outputPriceUsd;
    const outputHuman = inputAmount.toNumber() * rate;
    const expectedOutput = CurrencyAmount.fromHumanAmount(
      outputToken,
      outputHuman
    );
    const slippageAmount = slippage.applyTo(expectedOutput);
    const minimumReceived = expectedOutput.subtract(slippageAmount);

    return new Trade(
      inputAmount,
      expectedOutput,
      minimumReceived,
      slippage,
      rate
    );
  }

  get route(): string {
    return `${this.inputAmount.token.symbol} → ${this.expectedOutput.token.symbol}`;
  }

  get rateDisplay(): string {
    return `1 ${this.inputAmount.token.symbol} ≈ ${this.rate.toFixed(6)} ${this.expectedOutput.token.symbol}`;
  }
}
