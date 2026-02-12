import { motion, useReducedMotion } from 'motion/react';
import type { FC } from 'react';

import { WalletSVG } from '@/components/ui/icons';

interface ConnectWalletProps {
  onConnect: () => void;
}

const HOVER_SPRING = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 25,
};

const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect }) => {
  const reducedMotion = useReducedMotion();

  return (
    <motion.button
      type="button"
      className="flex text-white cursor-pointer relative items-center rounded-xl gap-2 h-10 md:h-11 py-2 md:py-2.5 px-3 md:px-4 border-none font-semibold transition-colors duration-200 focus-ring"
      style={{
        background: 'var(--btn-primary-bg)',
        boxShadow: 'var(--btn-primary-shadow)',
        backdropFilter: `blur(var(--blur-md))`,
      }}
      whileHover={
        reducedMotion
          ? undefined
          : { y: -2, boxShadow: 'var(--btn-primary-hover-shadow)' }
      }
      whileTap={reducedMotion ? undefined : { scale: 0.98 }}
      transition={reducedMotion ? { duration: 0 } : HOVER_SPRING}
      onClick={onConnect}
    >
      <WalletSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
      <span>Login</span>
    </motion.button>
  );
};

export default ConnectWallet;
