import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Z_INDEX } from '@/constants/z-index';
import { useModal } from '@/hooks/store/use-modal';
import useEventListener from '@/hooks/ui/use-event-listener';
import { useSafeHeight } from '@/hooks/ui/use-safe-height';

const OVERLAY_EXIT = { opacity: 0 };
const OVERLAY_ANIMATE = { opacity: [0, 1] };
const OVERLAY_TRANSITION = { duration: 0.25 };

const CONTAINER_ANIMATE = { y: ['2rem', '0rem'], opacity: [0, 1] };
const CONTAINER_TRANSITION = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 35,
};

const REDUCED_CONTAINER_ANIMATE = { opacity: [0, 1] };
const REDUCED_CONTAINER_TRANSITION = { duration: 0.15 };

const ModalProvider: FC = () => {
  const {
    title,
    content,
    onClose,
    allowClose,
    handleClose,
    overlayProps,
    containerProps,
  } = useModal(
    useShallow((s) => ({
      title: s.title,
      content: s.content,
      onClose: s.onClose,
      allowClose: s.allowClose,
      handleClose: s.handleClose,
      overlayProps: s.overlayProps,
      containerProps: s.containerProps,
    }))
  );
  const safeHeight = useSafeHeight();
  const reducedMotion = useReducedMotion();

  const onHandleClose = () => {
    if (!allowClose) return;

    handleClose();
    onClose?.();
  };

  useEventListener(
    'keydown',
    (e) => {
      if (e && (e as KeyboardEvent).key === 'Escape') onHandleClose();
    },
    true
  );

  if (!content) return null;

  return (
    <AnimatePresence>
      {content ? (
        <motion.div
          className="inset-0 fixed w-screen flex justify-center items-end md:items-center"
          style={{
            zIndex: Z_INDEX.OVERLAY,
            background: 'var(--color-overlay-bg)',
            height: safeHeight,
            backdropFilter: `blur(var(--blur-md))`,
            paddingTop: `calc(100vh - ${safeHeight}px)`,
          }}
          exit={OVERLAY_EXIT}
          onClick={onHandleClose}
          animate={OVERLAY_ANIMATE}
          transition={OVERLAY_TRANSITION}
          {...overlayProps}
        >
          <motion.div
            className="flex max-w-screen md:max-w-[95vw]"
            style={{ maxHeight: safeHeight * 0.9 }}
            transition={
              reducedMotion
                ? REDUCED_CONTAINER_TRANSITION
                : CONTAINER_TRANSITION
            }
            animate={
              reducedMotion ? REDUCED_CONTAINER_ANIMATE : CONTAINER_ANIMATE
            }
            drag={
              typeof window !== 'undefined' && window.innerWidth < 768
                ? 'y'
                : false
            }
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onHandleClose();
            }}
            {...containerProps}
            onClick={(e) => {
              e.stopPropagation();
              containerProps?.onClick?.(e);
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={title || undefined}
              className="p-4 gap-6 w-[27rem] flex text-text max-h-full flex-col rounded-t-[1rem] md:rounded-[1rem] border border-modal-border"
              style={{
                backdropFilter: `blur(var(--blur-xl))`,
                background: 'var(--modal-bg)',
                boxShadow: 'var(--modal-shadow)',
              }}
            >
              <div className="px-2 pt-2 flex justify-between items-center">
                <p className="text-xl font-semibold">{title}</p>
                <button
                  type="button"
                  aria-label="Close modal"
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
              {content}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ModalProvider;
