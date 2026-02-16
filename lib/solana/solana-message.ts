import { fromHex } from '@mysten/sui/utils';

const SYSTEM_PROGRAM = new Uint8Array(32);
const NONCE_SYSVAR = fromHex(
  '06a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000'
);
const ADVANCE_NONCE_DISCRIMINATOR = Buffer.from([0x04, 0x00, 0x00, 0x00]);
const TRANSFER_DISCRIMINATOR = Buffer.from([0x02, 0x00, 0x00, 0x00]);

const u64ToLeBytes = (value: bigint): Buffer => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
};

export interface BuildNativeSolTransferParams {
  dWallet: Uint8Array;
  nonce: Uint8Array;
  nonceAccount: Uint8Array;
  destinationWallet: Uint8Array;
  amount: bigint;
}

export const buildNativeSolTransfer = ({
  dWallet,
  nonce,
  nonceAccount,
  destinationWallet,
  amount,
}: BuildNativeSolTransferParams): Uint8Array => {
  return Buffer.concat([
    Buffer.from([2, 0, 2, 5]),
    destinationWallet,
    dWallet,
    nonceAccount,
    SYSTEM_PROGRAM,
    NONCE_SYSVAR,
    nonce,
    Buffer.from([2]),
    Buffer.from([3, 3, 2, 4, 0, 4]),
    ADVANCE_NONCE_DISCRIMINATOR,
    Buffer.from([3, 2, 1, 0, 12]),
    TRANSFER_DISCRIMINATOR,
    u64ToLeBytes(amount),
  ]);
};
