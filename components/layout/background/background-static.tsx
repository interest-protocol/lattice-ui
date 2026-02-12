import type { FC } from 'react';

const BackgroundStatic: FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      pointerEvents: 'none',
      background: `
        radial-gradient(ellipse at 30% 20%, var(--color-accent-wash) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 80%, var(--color-accent-wash) 0%, transparent 50%)
      `,
      opacity: 0.6,
    }}
  />
);

export default BackgroundStatic;
