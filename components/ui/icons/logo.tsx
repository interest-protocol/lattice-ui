import type { FC } from 'react';

import type { SVGProps } from './icons.types';

const Logo: FC<SVGProps> = ({ maxWidth, maxHeight, ...props }) => (
  <svg
    aria-hidden="true"
    style={{ maxWidth, maxHeight }}
    viewBox="0 0 40 40"
    fill="none"
    {...props}
  >
    <defs>
      <linearGradient
        id="lattice-grad"
        x1="5"
        y1="3"
        x2="35"
        y2="37"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#06b6d4" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>

    <polygon
      points="5,11.5 20,3 35,11.5 20,20"
      fill="#22d3ee"
      fillOpacity="0.25"
    />
    <polygon
      points="5,11.5 20,20 20,37 5,28.5"
      fill="#0891b2"
      fillOpacity="0.3"
    />
    <polygon
      points="35,11.5 35,28.5 20,37 20,20"
      fill="#7c3aed"
      fillOpacity="0.3"
    />

    <polygon
      points="20,3 35,11.5 35,28.5 20,37 5,28.5 5,11.5"
      stroke="url(#lattice-grad)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />

    <line
      x1="20"
      y1="20"
      x2="20"
      y2="3"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="20"
      x2="35"
      y2="11.5"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="20"
      x2="5"
      y2="11.5"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    <line
      x1="20"
      y1="20"
      x2="20"
      y2="37"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="20"
      x2="35"
      y2="28.5"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <line
      x1="20"
      y1="20"
      x2="5"
      y2="28.5"
      stroke="url(#lattice-grad)"
      strokeWidth="1.2"
      strokeLinecap="round"
    />

    <line
      x1="12.5"
      y1="7.25"
      x2="27.5"
      y2="15.75"
      stroke="#22d3ee"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />
    <line
      x1="27.5"
      y1="7.25"
      x2="12.5"
      y2="15.75"
      stroke="#22d3ee"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />

    <line
      x1="35"
      y1="20"
      x2="20"
      y2="28.5"
      stroke="#8b5cf6"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />
    <line
      x1="27.5"
      y1="15.75"
      x2="27.5"
      y2="32.75"
      stroke="#8b5cf6"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />

    <line
      x1="5"
      y1="20"
      x2="20"
      y2="28.5"
      stroke="#0891b2"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />
    <line
      x1="12.5"
      y1="15.75"
      x2="12.5"
      y2="32.75"
      stroke="#0891b2"
      strokeWidth="0.75"
      strokeLinecap="round"
      opacity="0.5"
    />

    <circle cx="20" cy="20" r="5" fill="#22d3ee" fillOpacity="0.15" />
    <circle cx="20" cy="20" r="2.5" fill="#e0f7fa" />

    <circle cx="20" cy="11.5" r="1.25" fill="#22d3ee" fillOpacity="0.7" />
    <circle cx="27.5" cy="24.25" r="1.25" fill="#8b5cf6" fillOpacity="0.6" />
    <circle cx="12.5" cy="24.25" r="1.25" fill="#0891b2" fillOpacity="0.65" />
  </svg>
);

export default Logo;
