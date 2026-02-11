import Image from 'next/image';
import type { FC } from 'react';
import type { ChainTokenOption } from '@/constants/chains/chain-tokens';
import { useModal } from '@/hooks/store/use-modal';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { formatMoney } from '@/utils';

interface WithdrawTokenModalProps {
  tokens: ChainTokenOption[];
  selectedType: string;
  getBalance: (index: number) => bigint;
  onSelect: (index: number) => void;
}

const WithdrawTokenModal: FC<WithdrawTokenModalProps> = ({
  tokens,
  selectedType,
  getBalance,
  onSelect,
}) => {
  const handleClose = useModal((s) => s.handleClose);

  return (
    <div className="gap-3 px-2 flex flex-col">
      {tokens.map((token, index) => {
        const isSelected = token.type === selectedType;
        const balance = getBalance(index);
        const balanceFormatted = formatMoney(
          FixedPointMath.toNumber(balance, token.decimals)
        );

        return (
          <button
            type="button"
            key={token.type}
            className="p-4 gap-4 flex items-center cursor-pointer rounded-2xl border transition-all duration-200 bg-transparent text-inherit text-left"
            style={{
              border: `1px solid ${isSelected ? 'var(--color-accent-border)' : 'var(--color-surface-border)'}`,
              background: isSelected
                ? 'var(--color-accent-wash)'
                : 'transparent',
            }}
            onClick={() => {
              onSelect(index);
              handleClose();
            }}
          >
            {token.iconUrl ? (
              <span className="flex overflow-hidden rounded-lg w-10 h-10 min-w-10 bg-surface-lighter items-center justify-center p-1.5">
                <Image
                  alt={token.name}
                  className="object-contain"
                  src={token.iconUrl}
                  width={28}
                  height={28}
                />
              </span>
            ) : null}
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-text font-semibold text-sm">
                {token.symbol}
              </span>
              <span className="text-text-muted text-xs">{token.name}</span>
            </div>
            <span className="text-text-secondary text-sm font-mono">
              {balanceFormatted}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default WithdrawTokenModal;
