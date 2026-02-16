import type { FC } from 'react';

interface SpinnerProps {
  size?: string;
  className?: string;
}

const Spinner: FC<SpinnerProps> = ({ size = '1em', className = '' }) => (
  // biome-ignore lint/a11y/useSemanticElements: <output> implies form-associated value; <span role="status"> is semantically correct for a loading indicator
  <span
    role="status"
    className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
    style={{ width: size, height: size }}
    aria-label="Loading"
  />
);

export default Spinner;
