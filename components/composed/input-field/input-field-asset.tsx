import Image from 'next/image';
import type { FC } from 'react';
import { FormProvider, useFormContext, useWatch } from 'react-hook-form';
import Skeleton from 'react-loading-skeleton';
import { ChevronDownSVG } from '@/components/ui/icons';
import Motion from '@/components/ui/motion';
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
      <Motion
        className="gap-2 text-white flex text-base cursor-pointer overflow-hidden items-center justify-center"
        whileHover="hover"
      >
        <Skeleton width="2rem" height="2rem" />
        <Skeleton width="4rem" />
      </Motion>
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
    <Motion
      className="gap-2 text-white flex text-base cursor-pointer overflow-hidden items-center justify-center"
      whileHover="hover"
      onClick={handleClick}
    >
      <span className="overflow-hidden rounded-full flex w-8 h-8 min-w-8 items-center justify-center">
        <Image
          className="object-contain"
          alt={metadata[type]?.symbol ?? ''}
          src={metadata[type]?.iconUrl ?? ''}
          width={32}
          height={32}
        />
      </span>
      {metadata?.[type]?.symbol ?? 'Select Coin'}
      <ChevronDownSVG maxWidth="1rem" width="100%" />
    </Motion>
  );
};

export default InputFieldAsset;
