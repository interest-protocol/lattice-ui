import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { handleKeyDown } from './handle-key-down';

const makeKeyEvent = (key: string): KeyboardEvent => {
  const preventDefault = vi.fn();
  return { key, preventDefault } as unknown as KeyboardEvent;
};

describe('handleKeyDown', () => {
  it('calls callback on Enter', () => {
    const cb = vi.fn();
    const event = makeKeyEvent('Enter');
    handleKeyDown(cb)(event);
    expect(cb).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('calls callback on Space', () => {
    const cb = vi.fn();
    const event = makeKeyEvent(' ');
    handleKeyDown(cb)(event);
    expect(cb).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('does not call callback on other keys', () => {
    const cb = vi.fn();
    const event = makeKeyEvent('Escape');
    handleKeyDown(cb)(event);
    expect(cb).not.toHaveBeenCalled();
  });

  it('calls preventDefault when triggered', () => {
    const cb = vi.fn();
    const event = makeKeyEvent('Enter');
    handleKeyDown(cb)(event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
});
