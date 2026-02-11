'use client';

import { AnimatePresence, motion } from 'motion/react';
import { type FC, useEffect, useRef, useState } from 'react';
import { toasting } from '@/components/ui/toast';

interface CopyButtonProps {
  text: string;
  size?: string;
  className?: string;
  ariaLabel?: string;
}

const iconTransition = { duration: 0.15 };

const CopyButton: FC<CopyButtonProps> = ({
  text,
  size = '1rem',
  className,
  ariaLabel = 'Copy',
}) => {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = () => {
    window.navigator.clipboard.writeText(text);
    toasting.success({ action: 'Copy', message: 'Address copied' });
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      className={`cursor-pointer bg-transparent border-none p-0 transition-colors duration-200 ${className ?? ''}`}
      style={{ color: copied ? 'var(--color-success)' : undefined }}
      onClick={handleCopy}
      aria-label={ariaLabel}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.svg
            key="check"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            style={{ maxWidth: size, maxHeight: size }}
            width="100%"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={iconTransition}
          >
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ) : (
          <motion.svg
            key="copy"
            aria-hidden="true"
            viewBox="0 0 22 22"
            fill="none"
            style={{ maxWidth: size, maxHeight: size }}
            width="100%"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={iconTransition}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9.16663 8.02091C8.5338 8.02091 8.02079 8.53392 8.02079 9.16675V16.5001C8.02079 17.1329 8.5338 17.6459 9.16663 17.6459H16.5C17.1328 17.6459 17.6458 17.1329 17.6458 16.5001V9.16675C17.6458 8.53392 17.1328 8.02091 16.5 8.02091H9.16663ZM6.64579 9.16675C6.64579 7.77453 7.77441 6.64591 9.16663 6.64591H16.5C17.8922 6.64591 19.0208 7.77453 19.0208 9.16675V16.5001C19.0208 17.8923 17.8922 19.0209 16.5 19.0209H9.16663C7.77441 19.0209 6.64579 17.8923 6.64579 16.5001V9.16675Z"
              fill="currentColor"
            />
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.71746 3.71758C4.19021 3.24483 4.83139 2.97925 5.49996 2.97925H12.8333C13.5019 2.97925 14.143 3.24484 14.6158 3.71758C15.0885 4.19033 15.3541 4.83151 15.3541 5.50008V7.33341C15.3541 7.71311 15.0463 8.02091 14.6666 8.02091C14.2869 8.02091 13.9791 7.71311 13.9791 7.33341V5.50008C13.9791 5.19619 13.8584 4.90474 13.6435 4.68985C13.4286 4.47497 13.1372 4.35425 12.8333 4.35425H5.49996C5.19607 4.35425 4.90462 4.47497 4.68973 4.68985C4.47485 4.90474 4.35413 5.19619 4.35413 5.50008V12.8334C4.35413 13.1373 4.47485 13.4288 4.68973 13.6436C4.90462 13.8585 5.19607 13.9792 5.49996 13.9792H7.33329C7.71299 13.9792 8.02079 14.2871 8.02079 14.6667C8.02079 15.0464 7.71299 15.3542 7.33329 15.3542H5.49996C4.83139 15.3542 4.19021 15.0887 3.71746 14.6159C3.24471 14.1432 2.97913 13.502 2.97913 12.8334V5.50008C2.97913 4.83151 3.24471 4.19033 3.71746 3.71758Z"
              fill="currentColor"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  );
};

export default CopyButton;
