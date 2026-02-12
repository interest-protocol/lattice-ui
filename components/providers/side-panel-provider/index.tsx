'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { type FC, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Z_INDEX } from '@/constants/z-index';
import { useSidePanel } from '@/hooks/store/use-side-panel';
import useEventListener from '@/hooks/ui/use-event-listener';
import { useSafeHeight } from '@/hooks/ui/use-safe-height';

const OVERLAY_ANIMATE = { opacity: [0, 1] };
const OVERLAY_EXIT = { opacity: 0 };
const OVERLAY_TRANSITION = { duration: 0.25, ease: 'easeOut' as const };

const PANEL_INITIAL = { x: '100%' };
const PANEL_ANIMATE = { x: '0%' };
const PANEL_EXIT = { x: '105%' };
const PANEL_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 32,
  mass: 0.8,
};

const REDUCED_PANEL_INITIAL = { opacity: 0, x: '2%' };
const REDUCED_PANEL_ANIMATE = { opacity: 1, x: '0%' };
const REDUCED_PANEL_EXIT = { opacity: 0, x: '2%' };
const REDUCED_PANEL_TRANSITION = { duration: 0.15 };

const CONTENT_ANIMATE = { opacity: [0, 1], y: [8, 0] };
const CONTENT_TRANSITION = {
  duration: 0.25,
  ease: 'easeOut' as const,
  delay: 0.1,
};

const SidePanelProvider: FC = () => {
  const { isOpen, content, title, onClose, close } = useSidePanel(
    useShallow((s) => ({
      isOpen: s.isOpen,
      content: s.content,
      title: s.title,
      onClose: s.onClose,
      close: s.close,
    }))
  );
  const safeHeight = useSafeHeight();
  const reducedMotion = useReducedMotion();

  const handleClose = () => {
    close();
    onClose?.();
  };

  useEventListener('keydown', (e) => {
    if (isOpen && e && (e as KeyboardEvent).key === 'Escape') handleClose();
  });

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && content ? (
        <motion.div
          className="inset-0 fixed w-screen"
          style={{
            zIndex: Z_INDEX.OVERLAY,
            background: 'var(--color-overlay-bg)',
            height: safeHeight,
            backdropFilter: 'blur(var(--blur-sm))',
          }}
          animate={OVERLAY_ANIMATE}
          exit={OVERLAY_EXIT}
          transition={OVERLAY_TRANSITION}
          onClick={handleClose}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title || undefined}
            className="fixed top-0 right-0 flex flex-col text-text"
            style={{
              width: 'min(380px, 90vw)',
              height: safeHeight,
              backdropFilter: 'blur(var(--blur-xl)) saturate(1.5)',
              background: 'var(--modal-bg)',
              boxShadow: 'var(--modal-shadow)',
              borderLeft: '1px solid var(--color-modal-border)',
            }}
            initial={reducedMotion ? REDUCED_PANEL_INITIAL : PANEL_INITIAL}
            animate={reducedMotion ? REDUCED_PANEL_ANIMATE : PANEL_ANIMATE}
            exit={reducedMotion ? REDUCED_PANEL_EXIT : PANEL_EXIT}
            transition={
              reducedMotion ? REDUCED_PANEL_TRANSITION : PANEL_TRANSITION
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 flex justify-between items-center">
              <p className="text-xl font-semibold">{title}</p>
              <button
                type="button"
                aria-label="Close panel"
                className="w-8 h-8 flex items-center justify-center bg-surface-lighter cursor-pointer rounded-lg border-none text-text-secondary hover:text-text transition-colors duration-150 focus-ring"
                onClick={handleClose}
              >
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <path
                    d="M1 1l12 12M13 1L1 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <motion.div
              className="flex-1 overflow-y-auto px-6 pb-6"
              animate={CONTENT_ANIMATE}
              transition={CONTENT_TRANSITION}
            >
              {content}
            </motion.div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SidePanelProvider;
