import { create } from 'zustand';

interface UseBackgroundTranslate {
  X?: number;
  Y?: number;
  setTranslate: (args: { X?: number; Y?: number }) => void;
}

export const useBackgroundTranslate = create<UseBackgroundTranslate>((set) => ({
  setTranslate: set,
}));
