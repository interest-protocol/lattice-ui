import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import type { ChainKey } from '@/constants/chains';
import { SOL_TYPE } from '@/constants/coins';
import { coinTypeEquals } from '@/lib/sui/utils';

export const isNativeToken = (type: string, chain: ChainKey): boolean =>
  chain === 'sui' ? coinTypeEquals(type, SUI_TYPE_ARG) : type === SOL_TYPE;
