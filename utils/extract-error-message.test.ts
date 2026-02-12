import { describe, expect, it } from 'vitest';

import { extractErrorMessage } from './extract-error-message';

describe('extractErrorMessage', () => {
  it('extracts message from Error instance', () => {
    expect(extractErrorMessage(new Error('Something broke'))).toBe(
      'Something broke'
    );
  });

  it('returns string error as-is', () => {
    expect(extractErrorMessage('Network timeout')).toBe('Network timeout');
  });

  it('extracts from object with .message property', () => {
    expect(extractErrorMessage({ message: 'Object error' })).toBe(
      'Object error'
    );
  });

  it('returns fallback for null', () => {
    expect(extractErrorMessage(null, 'Fallback')).toBe('Fallback');
  });

  it('returns fallback for undefined', () => {
    expect(extractErrorMessage(undefined, 'Fallback')).toBe('Fallback');
  });

  it('returns fallback for number', () => {
    expect(extractErrorMessage(42, 'Fallback')).toBe('Fallback');
  });

  it('uses custom fallback', () => {
    expect(extractErrorMessage(null, 'Custom fallback')).toBe(
      'Custom fallback'
    );
  });

  it('uses default fallback "An error occurred"', () => {
    expect(extractErrorMessage(null)).toBe('An error occurred');
  });

  it('ignores object with non-string message', () => {
    expect(extractErrorMessage({ message: 42 }, 'Fallback')).toBe('Fallback');
  });
});
