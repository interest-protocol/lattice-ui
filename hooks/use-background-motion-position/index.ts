import { create } from 'zustand';

import type { UseBackgroundMotionTranslate } from './use-background-position.types';

export const useBackgroundMotionTranslate =
  create<UseBackgroundMotionTranslate>((set) => ({
    setTranslate: set,
  }));
