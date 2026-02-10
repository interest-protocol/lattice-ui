import type { HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { create } from 'zustand';

type ModalDivProps = Omit<HTMLMotionProps<'div'>, 'children'>;

interface UseModal {
  title: string;
  content: ReactNode;
  onClose?: () => void;
  allowClose?: boolean;
  handleClose: () => void;
  overlayProps?: ModalDivProps;
  containerProps?: ModalDivProps;
  setContent: (
    content: ReactNode,
    options: {
      title: string;
      onClose?: () => void;
      allowClose?: boolean;
      overlayProps?: ModalDivProps;
      containerProps?: ModalDivProps;
    }
  ) => void;
}

const defaultValues = {
  title: '',
  content: null,
  allowClose: true,
  onClose: undefined,
  overlayProps: undefined,
  containerProps: undefined,
};

export const useModal = create<UseModal>((set) => ({
  ...defaultValues,
  handleClose: () => set(defaultValues),
  setContent: (content, options) => set({ content, ...options }),
}));
