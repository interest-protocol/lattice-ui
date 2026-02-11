import type { FC } from 'react';

import { CopySVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';

const DepositModal: FC = () => {
  const { getAddress } = useWalletAddresses();
  const suiAddress = getAddress('sui');
  const solanaAddress = getAddress('solana');

  const copyAddress = (addr: string) => {
    window.navigator.clipboard.writeText(addr);
    toasting.success({ action: 'Copy', message: 'Address copied' });
  };

  return (
    <div className="flex flex-col gap-5 px-2">
      <div className="p-5 bg-surface-light rounded-xl border border-surface-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: '#4DA2FF1A' }}
          >
            S
          </div>
          <div>
            <p className="text-text font-semibold">Sui Network</p>
            <p className="text-text-muted text-xs">
              Send SUI tokens to your wallet address
            </p>
          </div>
        </div>
        {suiAddress ? (
          <>
            <div className="flex items-center gap-3 p-3 bg-surface-inset rounded-lg border border-surface-border">
              <span className="flex-1 text-text font-mono text-xs break-all">
                {suiAddress}
              </span>
              <button
                type="button"
                className="cursor-pointer hover:opacity-70 bg-transparent border-none p-0"
                onClick={() => copyAddress(suiAddress)}
                aria-label="Copy address"
              >
                <CopySVG maxWidth="1rem" width="100%" />
              </button>
            </div>
            <p className="text-text-dimmed text-xs">
              Only send Sui network assets to this address
            </p>
          </>
        ) : (
          <p className="text-text-dimmed text-sm">
            No Sui wallet connected. Create one from the Account page.
          </p>
        )}
      </div>

      <div className="p-5 bg-surface-light rounded-xl border border-surface-border flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: '#9945FF1A' }}
          >
            S
          </div>
          <div>
            <p className="text-text font-semibold">Solana Network</p>
            <p className="text-text-muted text-xs">
              Fund via card, exchange, or external wallet
            </p>
          </div>
        </div>
        {solanaAddress ? (
          <>
            <div className="flex items-center gap-3 p-3 bg-surface-inset rounded-lg border border-surface-border">
              <span className="flex-1 text-text font-mono text-xs break-all">
                {solanaAddress}
              </span>
              <button
                type="button"
                className="cursor-pointer hover:opacity-70 bg-transparent border-none p-0"
                onClick={() => copyAddress(solanaAddress)}
                aria-label="Copy address"
              >
                <CopySVG maxWidth="1rem" width="100%" />
              </button>
            </div>
            <p className="text-text-dimmed text-xs">
              Only send Solana network assets to this address
            </p>
          </>
        ) : (
          <p className="text-text-dimmed text-sm">
            No Solana wallet connected. Connect one to fund via Privy.
          </p>
        )}
      </div>
    </div>
  );
};

export default DepositModal;
