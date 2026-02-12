import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';

import { SOL_TYPE } from '@/constants/coins';

import { Token } from './token';

describe('Token', () => {
  describe('constructor', () => {
    it('creates a token with all properties', () => {
      const token = new Token({
        chainId: 'sui',
        type: 'custom::type',
        decimals: 6,
        symbol: 'TEST',
        name: 'Test Token',
        iconUrl: 'https://example.com/icon.svg',
      });
      expect(token.chainId).toBe('sui');
      expect(token.type).toBe('custom::type');
      expect(token.decimals).toBe(6);
      expect(token.symbol).toBe('TEST');
      expect(token.name).toBe('Test Token');
      expect(token.iconUrl).toBe('https://example.com/icon.svg');
    });
  });

  describe('singletons', () => {
    it('SUI has chainId "sui" and decimals 9', () => {
      expect(Token.SUI.chainId).toBe('sui');
      expect(Token.SUI.decimals).toBe(9);
      expect(Token.SUI.symbol).toBe('SUI');
    });

    it('SOL has chainId "solana" and decimals 9', () => {
      expect(Token.SOL.chainId).toBe('solana');
      expect(Token.SOL.decimals).toBe(9);
      expect(Token.SOL.symbol).toBe('SOL');
    });

    it('SUI type matches SUI_TYPE_ARG', () => {
      expect(Token.SUI.type).toBe(SUI_TYPE_ARG);
    });

    it('SOL type matches SOL_TYPE', () => {
      expect(Token.SOL.type).toBe(SOL_TYPE);
    });
  });

  describe('equals', () => {
    it('returns true for same reference', () => {
      expect(Token.SUI.equals(Token.SUI)).toBe(true);
    });

    it('returns true for same chain + type', () => {
      const sui2 = new Token({
        chainId: 'sui',
        type: SUI_TYPE_ARG,
        decimals: 9,
        symbol: 'SUI2',
        name: 'Sui Clone',
        iconUrl: '',
      });
      expect(Token.SUI.equals(sui2)).toBe(true);
    });

    it('returns false for different chains', () => {
      expect(Token.SUI.equals(Token.SOL)).toBe(false);
    });
  });

  describe('isSui / isSol', () => {
    it('Token.SUI.isSui() is true', () => {
      expect(Token.SUI.isSui()).toBe(true);
    });

    it('Token.SUI.isSol() is false', () => {
      expect(Token.SUI.isSol()).toBe(false);
    });

    it('Token.SOL.isSol() is true', () => {
      expect(Token.SOL.isSol()).toBe(true);
    });

    it('Token.SOL.isSui() is false', () => {
      expect(Token.SOL.isSui()).toBe(false);
    });
  });

  describe('fromType', () => {
    it('resolves SUI_TYPE_ARG to Token.SUI', () => {
      expect(Token.fromType(SUI_TYPE_ARG)).toBe(Token.SUI);
    });

    it('resolves SOL_TYPE to Token.SOL', () => {
      expect(Token.fromType(SOL_TYPE)).toBe(Token.SOL);
    });

    it('throws for unknown type', () => {
      expect(() => Token.fromType('unknown::type')).toThrow(
        'Unknown token type'
      );
    });
  });

  describe('toAssetMetadata', () => {
    it('returns correct shape for SUI', () => {
      const meta = Token.SUI.toAssetMetadata();
      expect(meta.name).toBe('Sui');
      expect(meta.symbol).toBe('SUI');
      expect(meta.decimals).toBe(9);
      expect(meta.type).toBe(SUI_TYPE_ARG);
      expect(meta.iconUrl).toBeDefined();
    });

    it('returns correct shape for SOL', () => {
      const meta = Token.SOL.toAssetMetadata();
      expect(meta.name).toBe('Solana');
      expect(meta.symbol).toBe('SOL');
      expect(meta.decimals).toBe(9);
    });
  });
});
