import { NETWORK, type Network } from '@/constants/network';

/** UI-only: no chain context. */
export const useNetwork = () => NETWORK as Network;
