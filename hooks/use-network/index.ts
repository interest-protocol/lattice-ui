import { Network, NETWORK } from '@/constants/network';

/** UI-only: no chain context. */
export const useNetwork = () => NETWORK as Network;
