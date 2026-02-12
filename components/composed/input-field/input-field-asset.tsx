import { motion } from 'motion/react';
import Image from 'next/image';
import type { FC } from 'react';
import { FormProvider, useFormContext, useWatch } from 'react-hook-form';
import Skeleton from 'react-loading-skeleton';
import { ChevronDownSVG } from '@/components/ui/icons';
import useMetadata from '@/hooks/domain/use-metadata';
import { useModal } from '@/hooks/store/use-modal';
import type { InputFieldAssetProps } from './input-field.types';
import InputFieldModal from './input-field-modal';

const InputFieldAsset: FC<InputFieldAssetProps> = ({
  name,
  types,
  oppositeName,
}) => {
  const form = useFormContext();
  const setContent = useModal((s) => s.setContent);
  const { data: metadata, isLoading } = useMetadata(types);

  const { control } = form;

  const type = useWatch({ control, name: `${name}.type` }) as string;
  const oppositeType = useWatch({
    control,
    name: `${oppositeName}.type`,
  }) as string;

  const availableTypes = types.filter((item) => item !== oppositeType);

  if (isLoading || !metadata?.[type])
    return (
      <div className="gap-2 text-text flex text-base overflow-hidden items-center justify-center">
        <Skeleton width="2rem" height="2rem" />
        <Skeleton width="4rem" />
      </div>
    );

  const openAssetModal = () =>
    setContent(
      <FormProvider {...form}>
        <InputFieldModal
          name={name}
          oppositeName={oppositeName}
          assetList={Object.values(metadata)}
        />
      </FormProvider>,
      { title: 'Select Asset' }
    );

  const handleClick = () => {
    if (availableTypes.length > 1) {
      openAssetModal();
      return;
    }

    if (availableTypes.length === 1 && oppositeName) {
      const fromValue = form.getValues(name);
      const toValue = form.getValues(oppositeName);
      form.setValue(name, toValue);
      form.setValue(oppositeName, fromValue);
    }
  };

  return (
    <motion.button
      type="button"
      className="flex gap-2.5 text-text text-sm font-semibold cursor-pointer overflow-hidden items-center justify-center rounded-full px-3 py-2 border-none"
      style={{
        background: 'var(--token-pill-bg)',
        border: '1px solid var(--token-pill-border)',
        boxShadow: 'var(--token-pill-shadow)',
      }}
      onClick={handleClick}
      aria-label={`Select ${metadata?.[type]?.symbol ?? 'token'}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <span className="overflow-hidden rounded-full flex w-7 h-7 min-w-7 items-center justify-center">
        <Image
          className="object-contain"
          alt={metadata[type]?.symbol ?? ''}
          src={metadata[type]?.iconUrl ?? ''}
          width={28}
          height={28}
        />
      </span>
      {metadata?.[type]?.symbol ?? 'Select Coin'}
      <span className="text-text-muted">
        <ChevronDownSVG maxWidth="0.75rem" width="100%" />
      </span>
    </motion.button>
  );
};

export default InputFieldAsset;
