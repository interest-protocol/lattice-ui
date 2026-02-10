import { ChainId } from '@interest-protocol/xswap-sdk';
import { describe, expect, it } from 'vitest';

import { CHAIN_KEY_TO_SDK_ID, sdkChainIdFromKey } from './sdk-mapping';

describe('sdk-mapping', () => {
  describe('CHAIN_KEY_TO_SDK_ID', () => {
    it('maps sui to ChainId.Sui', () => {
      expect(CHAIN_KEY_TO_SDK_ID.sui).toBe(ChainId.Sui);
    });

    it('maps solana to ChainId.Solana', () => {
      expect(CHAIN_KEY_TO_SDK_ID.solana).toBe(ChainId.Solana);
    });
  });

  describe('sdkChainIdFromKey', () => {
    it('returns Sui ChainId for "sui"', () => {
      expect(sdkChainIdFromKey('sui')).toBe(ChainId.Sui);
    });

    it('returns Solana ChainId for "solana"', () => {
      expect(sdkChainIdFromKey('solana')).toBe(ChainId.Solana);
    });
  });
});
