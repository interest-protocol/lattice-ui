import type { ChangeEvent } from 'react';
import { describe, expect, it } from 'vitest';

import { parseInputEventToNumberString } from './number';

const makeEvent = (value: string): ChangeEvent<HTMLInputElement> =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe('parseInputEventToNumberString', () => {
  it('passes through valid number', () => {
    expect(parseInputEventToNumberString(makeEvent('42.5'))).toBe('42.5');
  });

  it('strips non-numeric characters', () => {
    expect(parseInputEventToNumberString(makeEvent('1a2b3'))).toBe('123');
  });

  it('preserves single decimal point', () => {
    expect(parseInputEventToNumberString(makeEvent('1.5'))).toBe('1.5');
  });

  it('removes duplicate dots', () => {
    expect(parseInputEventToNumberString(makeEvent('1.2.3'))).toBe('1.23');
  });

  it('returns "0" for NaN input', () => {
    expect(parseInputEventToNumberString(makeEvent('abc'))).toBe('0');
  });

  it('enforces max value', () => {
    expect(parseInputEventToNumberString(makeEvent('999'), 100)).toBe('100');
  });

  it('strips leading zeros', () => {
    expect(parseInputEventToNumberString(makeEvent('007'))).toBe('7');
  });

  it('preserves "0." prefix for decimal entry', () => {
    expect(parseInputEventToNumberString(makeEvent('0.5'))).toBe('0.5');
  });

  it('returns "0" for empty input', () => {
    expect(parseInputEventToNumberString(makeEvent(''))).toBe('0');
  });

  it('handles only a dot', () => {
    expect(parseInputEventToNumberString(makeEvent('.'))).toBe('0');
  });
});
