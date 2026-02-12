import { describe, expect, it } from 'vitest';

import { CHAIN_REGISTRY } from '@/constants/chains';
import { CurrencyAmount, Token } from '@/lib/entities';
import { parseUnits } from '@/lib/bigint-utils';

import {
  validateAlphaLimit,
  validateGasBalance,
  validateSwapAmount,
  validateSwapInput,
} from './gas-validation';

describe('gas-validation', () => {
  describe('validateAlphaLimit', () => {
    it('returns null when SUI amount is within limit', () => {
      expect(validateAlphaLimit('SUI', 0.1)).toBeNull();
    });

    it('returns null when SUI amount equals limit', () => {
      expect(validateAlphaLimit('SUI', CHAIN_REGISTRY.sui.alphaMax)).toBeNull();
    });

    it('returns error when SUI amount exceeds limit', () => {
      const result = validateAlphaLimit(
        'SUI',
        CHAIN_REGISTRY.sui.alphaMax + 0.1
      );
      expect(result).not.toBeNull();
      expect(result!.isDisabled).toBe(true);
      expect(result!.message).toContain('alpha limit');
      expect(result!.message).toContain(String(CHAIN_REGISTRY.sui.alphaMax));
      expect(result!.message).toContain('SUI');
    });

    it('returns null when SOL amount is within limit', () => {
      expect(validateAlphaLimit('SOL', 0.0001)).toBeNull();
    });

    it('returns error when SOL amount exceeds limit', () => {
      const result = validateAlphaLimit(
        'SOL',
        CHAIN_REGISTRY.solana.alphaMax + 0.001
      );
      expect(result).not.toBeNull();
      expect(result!.isDisabled).toBe(true);
      expect(result!.message).toContain('SOL');
    });

    it('error message includes max and symbol', () => {
      const result = validateAlphaLimit('SUI', 999);
      expect(result!.message).toContain(
        String(CHAIN_REGISTRY.sui.alphaMax)
      );
      expect(result!.message).toContain('SUI');
    });
  });

  describe('validateGasBalance', () => {
    const gasDecimals = 9;
    const minGas = 0.01;
    const displayDecimals = 4;

    it('returns null when balance is sufficient (non-gas token)', () => {
      const result = validateGasBalance({
        gasBalance: parseUnits('1', gasDecimals),
        gasDecimals,
        minGas,
        amount: 0.5,
        isGasToken: false,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result).toBeNull();
    });

    it('returns error when gas insufficient (non-gas token)', () => {
      const result = validateGasBalance({
        gasBalance: parseUnits('0.001', gasDecimals),
        gasDecimals,
        minGas,
        amount: 0.5,
        isGasToken: false,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result).not.toBeNull();
      expect(result!.message).toContain('gas');
    });

    it('returns error when gas + amount insufficient (gas token)', () => {
      // Need 0.5 amount + 0.01 gas = 0.51, but only have 0.4
      const result = validateGasBalance({
        gasBalance: parseUnits('0.4', gasDecimals),
        gasDecimals,
        minGas,
        amount: 0.5,
        isGasToken: true,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result).not.toBeNull();
      expect(result!.message).toContain('Insufficient');
    });

    it('returns null when gas + amount exactly sufficient', () => {
      // Need 0.01 gas + 0.5 amount = 0.51, have 0.51
      const result = validateGasBalance({
        gasBalance: parseUnits('0.51', gasDecimals),
        gasDecimals,
        minGas,
        amount: 0.5,
        isGasToken: true,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result).toBeNull();
    });

    it('error message format for gas token includes amount + gas', () => {
      const result = validateGasBalance({
        gasBalance: 0n,
        gasDecimals,
        minGas: 0.01,
        amount: 0.5,
        isGasToken: true,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result!.message).toContain('0.5');
      expect(result!.message).toContain('0.01');
    });

    it('error message format for non-gas token', () => {
      const result = validateGasBalance({
        gasBalance: 0n,
        gasDecimals,
        minGas: 0.01,
        amount: 0.5,
        isGasToken: false,
        symbol: 'SUI',
        displayDecimals,
      });
      expect(result!.message).toContain('gas');
      expect(result!.message).toContain('0.01');
    });
  });

  describe('validateSwapInput', () => {
    const sufficientGas = parseUnits('10', 9);

    it('returns "Enter amount" for empty string', () => {
      const result = validateSwapInput({
        amount: '',
        token: 'SUI',
        gasBalance: sufficientGas,
      });
      expect(result.isDisabled).toBe(true);
      expect(result.message).toBe('Enter amount');
    });

    it('returns "Enter amount" for "0"', () => {
      const result = validateSwapInput({
        amount: '0',
        token: 'SUI',
        gasBalance: sufficientGas,
      });
      expect(result.isDisabled).toBe(true);
      expect(result.message).toBe('Enter amount');
    });

    it('returns alpha error when above limit', () => {
      const result = validateSwapInput({
        amount: '999',
        token: 'SUI',
        gasBalance: sufficientGas,
      });
      expect(result.isDisabled).toBe(true);
      expect(result.message).toContain('alpha limit');
    });

    it('returns gas error when insufficient', () => {
      const result = validateSwapInput({
        amount: '0.1',
        token: 'SUI',
        gasBalance: 0n,
      });
      expect(result.isDisabled).toBe(true);
      expect(result.message).toContain('Insufficient');
    });

    it('returns valid for good input', () => {
      const result = validateSwapInput({
        amount: '0.1',
        token: 'SUI',
        gasBalance: sufficientGas,
      });
      expect(result.isDisabled).toBe(false);
      expect(result.message).toBeNull();
    });

    it('respects isGasToken flag', () => {
      // Enough gas on its own (10), but not if we also need 9.99 from the same balance
      const result = validateSwapInput({
        amount: '0.0001',
        token: 'SOL',
        gasBalance: parseUnits('0.001', 9),
        isGasToken: true,
      });
      // amount (0.0001) + minGas (0.00001) = 0.00011 <= 0.001
      expect(result.isDisabled).toBe(false);
    });
  });

  describe('validateSwapAmount', () => {
    it('returns "Enter amount" for zero CurrencyAmount', () => {
      const amount = CurrencyAmount.zero(Token.SUI);
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SUI, '10');
      const result = validateSwapAmount(amount, gasBalance);
      expect(result.isDisabled).toBe(true);
      expect(result.message).toBe('Enter amount');
    });

    it('returns alpha error when above limit', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '999');
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SUI, '1000');
      const result = validateSwapAmount(amount, gasBalance);
      expect(result.isDisabled).toBe(true);
      expect(result.message).toContain('alpha limit');
    });

    it('returns gas error when insufficient', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '0.1');
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SUI, '0');
      const result = validateSwapAmount(amount, gasBalance);
      expect(result.isDisabled).toBe(true);
      expect(result.message).toContain('Insufficient');
    });

    it('returns valid for good amount', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '0.1');
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SUI, '10');
      const result = validateSwapAmount(amount, gasBalance);
      expect(result.isDisabled).toBe(false);
      expect(result.message).toBeNull();
    });

    it('detects isGasToken when tokens match', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SUI, '0.1');
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SUI, '10');
      const result = validateSwapAmount(amount, gasBalance);
      // Should internally detect isGasToken = true (both SUI)
      expect(result.isDisabled).toBe(false);
    });

    it('handles SOL validation', () => {
      const amount = CurrencyAmount.fromHumanAmount(Token.SOL, '0.0001');
      const gasBalance = CurrencyAmount.fromHumanAmount(Token.SOL, '0.001');
      const result = validateSwapAmount(amount, gasBalance);
      expect(result.isDisabled).toBe(false);
    });
  });
});
