import { describe, expect, it } from 'vitest';

import { strip0xPrefix } from '../hex';

describe('strip0xPrefix', () => {
  it('strips 0x prefix', () => {
    expect(strip0xPrefix('0xabc123')).toBe('abc123');
  });

  it('returns string unchanged if no prefix', () => {
    expect(strip0xPrefix('abc123')).toBe('abc123');
  });

  it('only strips one 0x prefix', () => {
    expect(strip0xPrefix('0x0xabc')).toBe('0xabc');
  });
});
