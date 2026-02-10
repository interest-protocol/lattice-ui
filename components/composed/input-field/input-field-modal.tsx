import { Div, Img, Input, Label, P, Span } from '@stylin.js/elements';
import { type FC, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { useAppState } from '@/hooks/store/use-app-state';
import { useModal } from '@/hooks/store/use-modal';
import { FixedPointMath } from '@/lib/entities/fixed-point-math';
import { ZERO_BIG_NUMBER } from '@/utils';

import { SearchSVG } from '@/components/ui/icons';
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
      <Label
        px="1rem"
        mx="0.5rem"
        gap="0.5rem"
        bg="#FFFFFF1A"
        display="flex"
        alignItems="center"
        borderRadius="0.75rem"
      >
        <Label color="#FFFFFF80">
          <SearchSVG maxWidth="1.25rem" width="100%" />
        </Label>
        <Input
          py="1rem"
          width="100%"
          border="none"
          outline="none"
          bg="transparent"
          color="#FFFFFF80"
          placeholder="Search asset"
          onChange={(e) => setSearch(e.target.value.toLowerCase())}
        />
      </Label>
      <Div
        gap="1rem"
        px="0.5rem"
        display="flex"
        overflow="auto"
        flexDirection="column"
      >
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
            <Div
              p="1rem"
              key={type}
              gap="0.5rem"
              display="grid"
              cursor="pointer"
              borderRadius="1rem"
              border="1px solid #FFFFFF1A"
              gridTemplateColumns="2fr 1fr 1fr"
              nHover={{ borderColor: '#A78BFA4D', bg: '#A78BFA33' }}
              onClick={() => {
                setValue(`${fieldName}.type`, type);
                handleClose();
              }}
            >
              <Div display="flex" gap="1rem" alignItems="center">
                <Span
                  display="flex"
                  overflow="hidden"
                  borderRadius="0.5rem"
                  width="2.5rem"
                  height="2.5rem"
                  minWidth="2.5rem"
                  bg="#FFFFFF1A"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Img
                    alt={name}
                    width="100%"
                    height="100%"
                    objectFit="contain"
                    src={iconUrl}
                  />
                </Span>
                <P fontSize="0.875rem">{symbol}</P>
              </Div>
              <Div display="flex" alignItems="center">
                <Span
                  px="0.75rem"
                  py="0.25rem"
                  bg="#FFFFFF14"
                  fontSize="0.825rem"
                  borderRadius="1.5rem"
                  textTransform="uppercase"
                >
                  coin
                </Span>
              </Div>
              <Div
                gap="0.25rem"
                display="flex"
                textAlign="right"
                flexDirection="column"
                justifyContent="center"
              >
                <P fontSize="0.875rem" fontFamily="JetBrains Mono">
                  {
                    +FixedPointMath.toNumber(
                      balances[type] ?? ZERO_BIG_NUMBER,
                      decimals
                    ).toFixed(4)
                  }
                </P>
              </Div>
            </Div>
          ))}
      </Div>
    </>
  );
};

export default InputFieldModal;
