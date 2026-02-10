import { Button, Div, type DivElementProps, Span } from '@stylin.js/elements';
import { AnimatePresence } from 'motion/react';
import { type FC, useState } from 'react';

import useClickOutsideListenerRef from '@/hooks/use-click-outside-listener-ref';

import { BarsSVG, CogSVG } from '../svg';
import SettingsMenu from './settings-menu';

const Settings: FC = () => {
  const [show, setShow] = useState(false);

  const menuRef = useClickOutsideListenerRef<DivElementProps>(() =>
    setShow(false)
  );

  return (
    <Div
      ref={menuRef}
      display="flex"
      position="relative"
      alignItems="flex-end"
      flexDirection="column"
    >
      <Button
        all="unset"
        color="#fff"
        lineHeight="0"
        display="flex"
        cursor="pointer"
        alignItems="center"
        justifyContent="center"
        width={['2rem', 'unset']}
        height={['2rem', 'unset']}
        onClick={() => setShow((prev) => !prev)}
        border="1px solid #A78BFA4D"
        borderRadius={['0.5rem', '0.75rem']}
        nHover={{ bg: '#A78BFA80', borderColor: '#A78BFA4D' }}
      >
        <Span
          p="0.25rem"
          transition="all 300ms linear"
          display={['inline-block', 'inline-block', 'inline-block', 'none']}
        >
          <BarsSVG maxWidth="1rem" maxHeight="1rem" width="100%" />
        </Span>
        <Span
          p={['0.5rem', '0.75rem']}
          transition="all 300ms linear"
          nHover={{ rotate: '90deg', color: '#FFFFFF' }}
          display={['none', 'none', 'none', 'inline-block']}
        >
          <CogSVG maxWidth="1.5rem" maxHeight="1.5rem" width="100%" />
        </Span>
      </Button>
      <AnimatePresence>{show && <SettingsMenu />}</AnimatePresence>
    </Div>
  );
};

export default Settings;
