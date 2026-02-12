import { motion, useReducedMotion } from 'motion/react';
import type { FC } from 'react';

import { SwapSVG } from '@/components/ui/icons';

const FLIP_BTN_STYLE = {
  background: 'var(--flip-btn-bg)',
  border: '1px solid var(--flip-btn-border)',
  boxShadow: 'var(--flip-btn-shadow)',
  backdropFilter: 'blur(12px)',
} as const;

const FLIP_BTN_HOVER = {
  rotate: 180,
  scale: 1.1,
  boxShadow: 'var(--flip-btn-hover-shadow)',
};

const FLIP_BTN_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 22,
};

interface FlipButtonProps {
  onClick: () => void;
  ariaLabel: string;
}

const FlipButton: FC<FlipButtonProps> = ({ onClick, ariaLabel }) => {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: '1px', background: 'var(--details-divider)' }}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        className="absolute z-10 flex justify-center items-center cursor-pointer bg-transparent border-none p-0"
        onClick={onClick}
      >
        <motion.div
          className="w-10 h-10 rounded-xl flex justify-center items-center text-text-secondary hover:text-text transition-colors duration-150"
          style={FLIP_BTN_STYLE}
          whileHover={reducedMotion ? undefined : FLIP_BTN_HOVER}
          whileTap={reducedMotion ? undefined : { scale: 0.95 }}
          transition={reducedMotion ? { duration: 0 } : FLIP_BTN_SPRING}
        >
          <SwapSVG maxHeight="1rem" />
        </motion.div>
      </button>
    </div>
  );
};

export default FlipButton;
