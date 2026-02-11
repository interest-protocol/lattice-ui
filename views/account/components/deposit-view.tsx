import { QRCodeSVG } from 'qrcode.react';
import type { FC } from 'react';

import { CopySVG } from '@/components/ui/icons';
import { toasting } from '@/components/ui/toast';
import { CHAIN_REGISTRY, type ChainKey } from '@/constants/chains';
import useWalletAddresses from '@/hooks/domain/use-wallet-addresses';

interface DepositViewProps {
  network: ChainKey;
}

const DepositView: FC<DepositViewProps> = ({ network }) => {
  const { getAddress } = useWalletAddresses();
  const config = CHAIN_REGISTRY[network];
  const address = getAddress(network);

  const copyAddress = () => {
    if (!address) return;
    window.navigator.clipboard.writeText(address);
    toasting.success({ action: 'Copy', message: 'Address copied' });
  };

  if (!address) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted text-sm">{config.noWalletMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="p-4 bg-white rounded-xl flex items-center justify-center">
        <QRCodeSVG value={address} size={160} level="H" />
      </div>

      <div className="w-full">
        <p className="text-text-muted text-xs mb-2 text-center">
          {config.displayName} Deposit Address
        </p>
        <button
          type="button"
          className="flex items-center gap-3 p-3 bg-surface-inset rounded-lg border border-surface-border cursor-pointer hover:bg-surface-light w-full"
          onClick={copyAddress}
        >
          <span className="flex-1 text-text font-mono text-[0.6875rem] break-all text-center">
            {address}
          </span>
          <div className="hover:opacity-70">
            <CopySVG maxWidth="1rem" width="100%" />
          </div>
        </button>
      </div>

      <div
        className="p-3 rounded-lg w-full"
        style={{
          background: `${config.color}1A`,
          border: `1px solid ${config.color}4D`,
        }}
      >
        <p className="text-text text-[0.8125rem] text-center">
          Only send {config.displayName} network assets to this address
        </p>
      </div>
    </div>
  );
};

export default DepositView;
