import type { FC } from 'react';

import BackgroundBlur from './background-blur';
import BackgroundStatic from './background-static';

const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const Background: FC = () => (
  <>
    <BackgroundBlur />
    <BackgroundStatic />
    {/* Noise grain overlay */}
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: 0.025,
        mixBlendMode: 'overlay',
        backgroundImage: NOISE_SVG,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
      }}
    />
  </>
);

export default Background;
