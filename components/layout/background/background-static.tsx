import type { FC } from 'react';

const BackgroundStatic: FC = () => (
  <div
    aria-hidden
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: -1,
      pointerEvents: 'none',
      overflow: 'hidden',
    }}
  >
    {/* Orb 1 — cyan, top-left */}
    <div
      className="bg-orb"
      style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '50vw',
        height: '50vw',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, var(--color-accent-wash) 0%, transparent 70%)',
        filter: 'blur(80px)',
        opacity: 0.7,
        willChange: 'transform',
        animation: 'orb-drift-1 25s ease-in-out infinite',
      }}
    />
    {/* Orb 2 — violet, bottom-right */}
    <div
      className="bg-orb"
      style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '45vw',
        height: '45vw',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, var(--color-accent-secondary-muted) 0%, transparent 70%)',
        filter: 'blur(80px)',
        opacity: 0.5,
        willChange: 'transform',
        animation: 'orb-drift-2 30s ease-in-out infinite',
      }}
    />
    {/* Orb 3 — subtle accent, center */}
    <div
      className="bg-orb"
      style={{
        position: 'absolute',
        top: '30%',
        left: '30%',
        width: '35vw',
        height: '35vw',
        borderRadius: '50%',
        background:
          'radial-gradient(circle, var(--color-accent-subtle) 0%, transparent 70%)',
        filter: 'blur(60px)',
        opacity: 0.4,
        willChange: 'transform',
        animation: 'orb-drift-3 20s ease-in-out infinite',
      }}
    />
  </div>
);

export default BackgroundStatic;
