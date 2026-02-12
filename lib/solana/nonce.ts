import { type Address, createAddressWithSeed } from '@solana/kit';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';

export const NONCE_SEED = 'lattice-nonce';

export const deriveNonceAddress = (userAddress: Address): Promise<Address> =>
  createAddressWithSeed({
    baseAddress: userAddress,
    programAddress: SYSTEM_PROGRAM_ADDRESS,
    seed: NONCE_SEED,
  });
