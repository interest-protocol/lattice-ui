import type { FC } from 'react';

import type { SVGProps } from './icons.types';

const Email: FC<SVGProps> = ({ maxWidth, maxHeight, ...props }) => (
  <svg
    aria-hidden="true"
    style={{ maxWidth, maxHeight }}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <title>Email</title>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Zm0 2v.01l8 5 8-5V6H4Zm0 2.23V18h16V8.23l-7.55 4.72a1 1 0 0 1-1.06 0L4 8.23Z"
      fill="currentColor"
    />
  </svg>
);

export default Email;
