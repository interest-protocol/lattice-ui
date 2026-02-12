import { describe, expect, it } from 'vitest';

import { formatAddress } from './format-address';

describe('formatAddress', () => {
  const longAddress = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  it('truncates long address with "..."', () => {
    const result = formatAddress(longAddress);
    expect(result).toContain('...');
    expect(result.length).toBeLessThan(longAddress.length);
  });

  it('returns short address unchanged', () => {
    expect(formatAddress('0x1234')).toBe('0x1234');
  });

  it('uses default prefix=6, suffix=4', () => {
    const result = formatAddress(longAddress);
    expect(result).toBe(`${longAddress.slice(0, 6)}...${longAddress.slice(-4)}`);
  });

  it('uses custom prefix and suffix lengths', () => {
    const result = formatAddress(longAddress, 10, 8);
    expect(result).toBe(
      `${longAddress.slice(0, 10)}...${longAddress.slice(-8)}`
    );
  });

  it('handles address at exact boundary (prefix + suffix)', () => {
    const exact = '0x12345678'; // 10 chars = 6 prefix + 4 suffix
    expect(formatAddress(exact)).toBe(exact);
  });

  it('handles empty string', () => {
    expect(formatAddress('')).toBe('');
  });
});
