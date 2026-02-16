import { fromHex } from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';

import { buildNativeSolTransfer } from './solana-message';

const bytes32 = (hexByte: string): Uint8Array => fromHex(hexByte.repeat(32));

describe('solana-message', () => {
  describe('buildNativeSolTransfer', () => {
    it('matches core xbridge native SOL message layout', () => {
      const dWallet = bytes32('33');
      const nonce = fromHex(
        '0000000000000000000000000000000000000000000000000000000000000001'
      );
      const nonceAccount = bytes32('11');
      const destinationWallet = bytes32('66');

      const msg = buildNativeSolTransfer({
        dWallet,
        nonce,
        nonceAccount,
        destinationWallet,
        amount: 100_000_000n,
      });

      expect(msg).toHaveLength(224);
      expect(Array.from(msg.slice(0, 4))).toEqual([2, 0, 2, 5]);

      expect(Array.from(msg.slice(4, 36))).toEqual(
        Array.from(destinationWallet)
      );
      expect(Array.from(msg.slice(36, 68))).toEqual(Array.from(dWallet));
      expect(Array.from(msg.slice(68, 100))).toEqual(Array.from(nonceAccount));

      expect(Array.from(msg.slice(216, 224))).toEqual([
        0x00, 0xe1, 0xf5, 0x05, 0x00, 0x00, 0x00, 0x00,
      ]);
    });
  });
});
