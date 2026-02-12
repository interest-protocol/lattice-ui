import type { FC } from 'react';

const BackgroundBlur: FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      filter: 'blur(50px)',
      background: 'var(--bg-blur)',
      backgroundPosition: 'top left',
      backgroundSize: 'cover',
    }}
  />
);

export default BackgroundBlur;
