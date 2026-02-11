import type { FC } from 'react';

interface SpinnerProps {
  size?: string;
  className?: string;
}

const Spinner: FC<SpinnerProps> = ({ size = '1em', className = '' }) => (
  <output
    className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    style={{ width: size, height: size }}
    aria-label="Loading"
  />
);

export default Spinner;
