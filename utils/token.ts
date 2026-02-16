import { SUI_TYPE_ARG } from '@mysten/sui/utils';
import type { ChainKey } from '@/constants/chains';
import { SOL_TYPE } from '@/constants/coins';
import { coinTypeEquals } from '@/utils/sui';

/** Returns true if the given token type is the native gas token for the specified chain. */
export const isNativeToken = (type: string, chain: ChainKey): boolean =>
  chain === 'sui' ? coinTypeEquals(type, SUI_TYPE_ARG) : type === SOL_TYPE;
