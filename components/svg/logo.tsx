import type { FC } from 'react';

import type { SVGProps } from './svg.types';

const Logo: FC<SVGProps> = ({ maxWidth, maxHeight, ...props }) => (
  <svg
    style={{ maxWidth, maxHeight }}
    viewBox="0 0 40 40"
    fill="none"
    {...props}
  >
    {/* Outer lattice frame */}
    <rect
      x="4"
      y="4"
      width="32"
      height="32"
      stroke="#A78BFA"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />

    {/* Vertical lattice lines */}
    <line
      x1="13.33"
      y1="4"
      x2="13.33"
      y2="36"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="26.67"
      y1="4"
      x2="26.67"
      y2="36"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Horizontal lattice lines */}
    <line
      x1="4"
      y1="13.33"
      x2="36"
      y2="13.33"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <line
      x1="4"
      y1="26.67"
      x2="36"
      y2="26.67"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    {/* Center connection nodes (representing swap/exchange) */}
    <circle cx="20" cy="20" r="3" fill="#A78BFA" />

    {/* Corner nodes */}
    <circle cx="13.33" cy="13.33" r="2" fill="#A78BFA" fillOpacity="0.6" />
    <circle cx="26.67" cy="13.33" r="2" fill="#A78BFA" fillOpacity="0.6" />
    <circle cx="13.33" cy="26.67" r="2" fill="#A78BFA" fillOpacity="0.6" />
    <circle cx="26.67" cy="26.67" r="2" fill="#A78BFA" fillOpacity="0.6" />

    {/* Diagonal connections from center (representing cross-chain flow) */}
    <line
      x1="20"
      y1="20"
      x2="13.33"
      y2="13.33"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <line
      x1="20"
      y1="20"
      x2="26.67"
      y2="13.33"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <line
      x1="20"
      y1="20"
      x2="13.33"
      y2="26.67"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
    <line
      x1="20"
      y1="20"
      x2="26.67"
      y2="26.67"
      stroke="#A78BFA"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);

export default Logo;
