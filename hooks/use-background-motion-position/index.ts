import type { MotionValue } from 'motion/react';
import { create } from 'zustand';

interface UseBackgroundMotionTranslate {
  x?: MotionValue<number>;
  y?: MotionValue<number>;
  setTranslate: (args: {
    x?: MotionValue<number>;
    y?: MotionValue<number>;
  }) => void;
}

export const useBackgroundMotionTranslate =
  create<UseBackgroundMotionTranslate>((set) => ({
    setTranslate: set,
  }));
