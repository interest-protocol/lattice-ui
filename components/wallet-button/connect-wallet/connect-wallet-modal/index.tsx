import { Div, P } from '@stylin.js/elements';
import type { FC } from 'react';

/** Unused when Privy is used; Connect button opens Privy modal. */
const ConnectWalletModal: FC = () => (
  <Div display="flex" flexDirection="column" gap="0.5rem">
    <P color="#FFFFFF80">
      Use the Connect Wallet button to sign in with Privy.
    </P>
  </Div>
);

export default ConnectWalletModal;
