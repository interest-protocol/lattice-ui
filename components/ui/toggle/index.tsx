import { motion } from 'motion/react';
import type { ChangeEventHandler, FC, PropsWithChildren } from 'react';

import type { CheckedButtonProps } from './toggle.types';

export const ToggleButton: FC<PropsWithChildren<CheckedButtonProps>> = ({
  onChange,
  disabled,
  defaultValue: active,
  ...props
}) => {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;
    onChange?.(event);
  };

  return (
    <div
      className="flex flex-wrap items-center"
      role="switch"
      aria-checked={active}
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
          className="flex w-11 h-[1.7rem] cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out"
          style={{
            opacity: disabled ? 0.4 : 1,
            background: !active ? '#0000003D' : '#C484F6',
          }}
        >
          <motion.span
            className="flex w-5 h-5 items-center rounded-full justify-center"
            style={{
              opacity: disabled ? 0.7 : 1,
              background: disabled ? '#D0D0D0' : '#ffffff',
            }}
            animate={{ x: active ? '1.3rem' : '0.25rem' }}
          />
        </div>
      </label>
    </div>
  );
};
