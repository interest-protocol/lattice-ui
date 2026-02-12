import { AnimatePresence, motion } from 'motion/react';
import { type FC, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { ChevronRightSVG } from '@/components/ui/icons';
import {
  DEFAULT_SLIPPAGE_BPS,
  MAX_SLIPPAGE_BPS,
  MIN_SLIPPAGE_BPS,
  SLIPPAGE_DISPLAY,
  SLIPPAGE_OPTIONS,
  SLIPPAGE_STORAGE_KEY,
  isSlippagePreset,
} from '@/constants';
import type { SettingsMenusProps } from './settings-menu.types';
import SettingsMenuItem from './settings-menu-item';

const SettingsMenuSlippage: FC<SettingsMenusProps> = ({ show, toggleShow }) => {
  const [slippageBps, setSlippageBps] = useLocalStorage<number>(
    SLIPPAGE_STORAGE_KEY,
    DEFAULT_SLIPPAGE_BPS
  );

  const isCustom = !isSlippagePreset(slippageBps);
  const [customInput, setCustomInput] = useState(
    isCustom ? String(slippageBps / 100) : ''
  );

  const applyCustom = (value: string) => {
    const parsed = Number.parseFloat(value);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    const bps = Math.round(parsed * 100);
    const clamped = Math.max(MIN_SLIPPAGE_BPS, Math.min(MAX_SLIPPAGE_BPS, bps));
    setSlippageBps(clamped);
    setCustomInput(String(clamped / 100));
  };

  return (
    <div>
      <button
        type="button"
        className="px-4 py-2 flex cursor-pointer items-center justify-between bg-transparent border-none w-full text-inherit"
        onClick={toggleShow}
      >
        <p>Slippage</p>
        <motion.div animate={{ rotate: show ? '90deg' : '0deg' }}>
          <ChevronRightSVG
            width="100%"
            maxWidth="1.25rem"
            maxHeight="1.25rem"
          />
        </motion.div>
      </button>
      <AnimatePresence>
        {show ? (
          <motion.div
            className="ml-6"
            style={{ originY: 0 }}
            exit={{ scaleY: 0, height: 0, opacity: 0 }}
            animate={{
              scaleY: [0, 1],
              height: [0, 'auto'],
              opacity: [0, 1, 1],
            }}
          >
            {SLIPPAGE_OPTIONS.map((bps, index) => (
              <SettingsMenuItem
                key={bps}
                name={String(bps)}
                withBorder={!!index}
                title={SLIPPAGE_DISPLAY[bps]}
                tag={bps === DEFAULT_SLIPPAGE_BPS ? 'Default' : null}
                selected={bps === slippageBps}
                onSelect={() => {
                  setSlippageBps(bps);
                  setCustomInput('');
                }}
              />
            ))}
            <div
              className="mx-4 py-2 flex items-center gap-2 border-t border-t-surface-border rounded-md transition-colors duration-150"
              style={isCustom ? {
                background: 'var(--color-accent-wash)',
                margin: '0 0.75rem',
                padding: '0.5rem 0.25rem',
              } : undefined}
            >
              <span
                className="text-sm transition-colors duration-150"
                style={{ color: isCustom ? 'var(--color-accent)' : undefined, fontWeight: isCustom ? 600 : undefined }}
              >
                Custom{isCustom ? ` (${slippageBps / 100}%)` : ''}
              </span>
              <div className="flex items-center ml-auto gap-1">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 0.3"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onBlur={() => applyCustom(customInput)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyCustom(customInput);
                  }}
                  className="w-16 px-2 py-1 text-sm text-right rounded-md border bg-surface-light text-text outline-none focus:border-accent"
                  style={{
                    borderColor: isCustom ? 'var(--color-accent)' : 'var(--color-surface-border)',
                  }}
                />
                <span className="text-sm text-text-muted">%</span>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default SettingsMenuSlippage;
