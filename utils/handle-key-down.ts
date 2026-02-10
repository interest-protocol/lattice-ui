import type { KeyboardEvent } from 'react';

export const handleKeyDown = (callback: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    callback();
  }
};
