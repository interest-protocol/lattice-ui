import { motion } from 'motion/react';
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

const ConnectWallet: FC<ConnectWalletProps> = ({ onConnect }) => (
  <motion.button
    type="button"
    className="flex text-white cursor-pointer relative items-center rounded-xl gap-2 py-2.5 md:py-3 px-3 md:px-4 border-none font-semibold transition-colors duration-200 focus-ring"
    style={{
      background: 'var(--btn-primary-bg)',
      boxShadow: 'var(--btn-primary-shadow)',
      backdropFilter: `blur(var(--blur-md))`,
    }}
    whileHover={{ y: -2, boxShadow: 'var(--btn-primary-hover-shadow)' }}
    whileTap={{ scale: 0.98 }}
    transition={HOVER_SPRING}
    onClick={onConnect}
  >
    <WalletSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
    <span>Login</span>
  </motion.button>
);

export default ConnectWallet;
