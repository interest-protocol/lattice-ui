import type React from 'react';

import type { TooltipIconProps } from './tooltip.types';

const TooltipIcon: React.FC<TooltipIconProps> = ({ icon: Icon, text }) => {
  return (
    <div className="relative inline-block group">
      <Icon width="0.75rem" height="0.75rem" />
      <span
        className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute -translate-x-1/2 bottom-[120%] left-1/2 z-10 leading-tight p-2 rounded-md whitespace-normal text-[0.9rem] max-w-[180px] w-max text-center transition-opacity duration-400 ease-in-out"
        style={{
          background: '#333',
          color: '#fff',
          boxShadow: 'inset 0 0 0 1px #888',
        }}
      >
        {text}
      </span>
    </div>
  );
};

export default TooltipIcon;
