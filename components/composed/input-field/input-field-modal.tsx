import Image from 'next/image';
import { type FC, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { SearchSVG } from '@/components/ui/icons';
import { useAppState } from '@/hooks/store/use-app-state';
import { useModal } from '@/hooks/store/use-modal';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { ZERO_BIG_INT } from '@/utils';
import type { InputFieldModalProps } from './input-field.types';

const InputFieldModal: FC<InputFieldModalProps> = ({
  assetList,
  oppositeName,
  name: fieldName,
}) => {
  const balances = useAppState((s) => s.balances);
  const handleClose = useModal((s) => s.handleClose);
  const { control, setValue } = useFormContext();
  const [search, setSearch] = useState('');

  const selectedTypes = useWatch({
    control,
    name: [fieldName, oppositeName].map((name) => `${name}.type`),
  }) as string[];

  return (
    <>
      <label className="px-4 mx-2 gap-2 bg-surface-lighter flex items-center rounded-xl">
        <span className="text-text-muted">
          <SearchSVG maxWidth="1.25rem" width="100%" />
        </span>
        <input
          className="py-4 w-full border-none outline-none bg-transparent text-text-muted"
          placeholder="Search asset"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
      </label>
      <div className="gap-4 px-2 flex overflow-auto flex-col">
        {assetList
          .filter(
            ({ symbol, type, name }) =>
              !selectedTypes.includes(type) &&
              (!search ||
                type.toLowerCase() === search ||
                name.toLowerCase().includes(search) ||
                symbol.toLowerCase().includes(search))
          )
          .map(({ symbol, type, decimals, name, iconUrl }) => (
            <button
              type="button"
              key={type}
              className="p-4 gap-2 grid cursor-pointer rounded-2xl border border-surface-border grid-cols-[2fr_1fr_1fr] hover:border-accent-4d hover:bg-accent-33 bg-transparent text-inherit text-left"
              onClick={() => {
                setValue(`${fieldName}.type`, type);
                handleClose();
              }}
            >
              <div className="flex gap-4 items-center">
                <span className="flex overflow-hidden rounded-lg w-10 h-10 min-w-10 bg-surface-lighter items-center justify-center">
                  <Image
                    alt={name}
                    className="object-contain"
                    src={iconUrl}
                    width={40}
                    height={40}
                  />
                </span>
                <p className="text-sm">{symbol}</p>
              </div>
              <div className="flex items-center">
                <span className="px-3 py-1 bg-text-dim text-[0.825rem] rounded-3xl uppercase">
                  coin
                </span>
              </div>
              <div className="gap-1 flex text-right flex-col justify-center">
                <p className="text-sm font-mono">
                  {
                    +FixedPointMath.toNumber(
                      balances[type] ?? ZERO_BIG_INT,
                      decimals
                    ).toFixed(4)
                  }
                </p>
              </div>
            </button>
          ))}
      </div>
    </>
  );
};

export default InputFieldModal;
