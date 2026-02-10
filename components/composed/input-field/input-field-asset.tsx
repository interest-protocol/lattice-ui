import { Img, Span } from '@stylin.js/elements';
import type { FC } from 'react';
import { FormProvider, useFormContext, useWatch } from 'react-hook-form';
import Skeleton from 'react-loading-skeleton';

import Motion from '@/components/ui/motion';
import useMetadata from '@/hooks/domain/use-metadata';
import { useModal } from '@/hooks/store/use-modal';

import { ChevronDownSVG } from '@/components/ui/icons';
import InputFieldModal from './input-field-modal';
import type { InputFieldAssetProps } from './input-field.types';

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
        gap="0.5rem"
        color="white"
        display="flex"
        fontSize="1rem"
        cursor="pointer"
        overflow="hidden"
        whileHover="hover"
        alignItems="center"
        justifyContent="center"
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

  return (
    <Motion
      gap="0.5rem"
      color="white"
      display="flex"
      fontSize="1rem"
      overflow="hidden"
      whileHover="hover"
      alignItems="center"
      justifyContent="center"
      cursor={availableTypes.length > 1 ? 'pointer' : 'default'}
      onClick={() => availableTypes.length > 1 && openAssetModal()}
    >
      <Span
        overflow="hidden"
        borderRadius="50%"
        display="flex"
        width="2rem"
        height="2rem"
        minWidth="2rem"
        bg="#FFFFFF1A"
        alignItems="center"
        justifyContent="center"
      >
        <Img
          width="100%"
          height="100%"
          objectFit="contain"
          alt={metadata[type]?.symbol}
          src={metadata[type]?.iconUrl}
        />
      </Span>
      {metadata?.[type]?.symbol ?? 'Select Coin'}
      {availableTypes.length > 1 && (
        <ChevronDownSVG maxWidth="1rem" width="100%" />
      )}
    </Motion>
  );
};

export default InputFieldAsset;
