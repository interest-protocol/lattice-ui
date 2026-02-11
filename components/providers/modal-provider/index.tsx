import { AnimatePresence, motion } from 'motion/react';
import type { FC } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useModal } from '@/hooks/store/use-modal';
import useEventListener from '@/hooks/ui/use-event-listener';
import { useSafeHeight } from '@/hooks/ui/use-safe-height';

const OVERLAY_EXIT = { opacity: 0 };
const OVERLAY_ANIMATE = { opacity: [0, 1] };
const OVERLAY_TRANSITION = { duration: 0.5 };
const CONTAINER_TRANSITION = { duration: 0.5, delay: 0.2 };
const CONTAINER_ANIMATE = { y: ['200vh', '0vh'], scale: [0.5, 1] };

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
          className="inset-0 fixed z-[99] w-screen flex justify-center items-end md:items-center"
          style={{
            background: 'var(--color-overlay-bg)',
            height: safeHeight,
            backdropFilter: 'blur(10px)',
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
            transition={CONTAINER_TRANSITION}
            animate={CONTAINER_ANIMATE}
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
                backdropFilter: 'blur(50px)',
                background: 'var(--modal-bg)',
                boxShadow: 'var(--modal-shadow)',
              }}
            >
              <div className="px-2 pt-2 flex justify-between">
                <p className="text-xl font-semibold">{title}</p>
                <button
                  type="button"
                  aria-label="Close modal"
                  className="py-1 px-3 bg-surface-lighter flex font-medium cursor-pointer rounded-lg border-none text-inherit"
                  onClick={handleClose}
                >
                  ESC
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
