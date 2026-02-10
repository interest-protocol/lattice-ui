import { create } from 'zustand';

import type { UseBackgroundTranslate } from './use-background-position.types';

export const useBackgroundTranslate = create<UseBackgroundTranslate>((set) => ({
  setTranslate: set,
}));
