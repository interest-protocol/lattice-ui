import type { ReactNode } from 'react';
import { create } from 'zustand';

interface UseSidePanel {
  isOpen: boolean;
  content: ReactNode;
  title: string;
  onClose?: () => void;
  open: (
    content: ReactNode,
    options: { title: string; onClose?: () => void }
  ) => void;
  close: () => void;
}

const defaultValues = {
  isOpen: false,
  content: null,
  title: '',
  onClose: undefined,
};

export const useSidePanel = create<UseSidePanel>((set) => ({
  ...defaultValues,
  open: (content, options) => set({ isOpen: true, content, ...options }),
  close: () => set(defaultValues),
}));
