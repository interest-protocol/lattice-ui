import { motion, useReducedMotion } from 'motion/react';
import type { ChangeEventHandler, FC, PropsWithChildren } from 'react';

import type { CheckedButtonProps } from './toggle.types';

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
  mass: 0.8,
};

export const ToggleButton: FC<PropsWithChildren<CheckedButtonProps>> = ({
  onChange,
  disabled,
  defaultValue: active,
  'aria-label': ariaLabel,
  ...props
}) => {
  const reducedMotion = useReducedMotion();

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    onChange?.(event);
  };

  return (
    <div
      className="flex flex-wrap items-center"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (!disabled) {
            onChange?.({
              target: { checked: !active },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        }
      }}
    >
      <label className="ml-1.5 flex relative rounded-full">
        <input
          className="hidden"
          type="checkbox"
          checked={active}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <div
          className="flex w-11 h-[1.7rem] cursor-pointer items-center rounded-full focus-ring"
          style={{
            opacity: disabled ? 0.4 : 1,
            background: active
              ? 'var(--toggle-track-active-bg)'
              : 'var(--color-toggle-inactive)',
            boxShadow: active
              ? 'var(--toggle-track-active-shadow)'
              : 'var(--toggle-track-inset-shadow)',
            transition:
              'background 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          }}
        >
          <motion.span
            initial={false}
            className="flex w-5 h-5 items-center rounded-full justify-center"
            style={{
              opacity: disabled ? 0.7 : 1,
              background: disabled
                ? 'var(--color-toggle-thumb-disabled)'
                : 'var(--color-toggle-thumb)',
              boxShadow:
                'var(--toggle-thumb-shadow), var(--toggle-thumb-highlight)',
            }}
            animate={{ x: active ? '1.3rem' : '0.25rem' }}
            whileTap={reducedMotion ? undefined : { scale: 1.15 }}
            transition={reducedMotion ? { duration: 0 } : SPRING_TRANSITION}
          />
        </div>
      </label>
    </div>
  );
};
