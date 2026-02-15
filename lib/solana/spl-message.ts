/**
 * Builds a raw Solana legacy message encoding:
 *   1. AdvanceNonce instruction
 *   2. CreateAssociatedTokenAccount (idempotent)
 *   3. SPL TransferChecked instruction
 *
 * This is used for the wSOL→SOL burn flow, where the message is signed
 * by both the user (nonceAuthority) and the dWallet (tokenOwner).
 *
 * Automatically deduplicates accounts when nonceAuthority == destinationWallet
 * (the frontend case where the user's Privy wallet serves both roles) to avoid
 * Solana's "Account loaded twice" rejection.
 *
 * Ported from core/scripts/src/flows/xbridge/wsol-to-sol/1-create-burn-request.ts
 */

import { fromHex } from '@mysten/sui/utils';

const SPL_TOKEN_PROGRAM = fromHex(
  '06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9'
);
const SPL_ATA_PROGRAM = fromHex(
  '8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859'
);
const SYSTEM_PROGRAM = new Uint8Array(32);
const NONCE_SYSVAR = fromHex(
  '06a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000'
);
const ADVANCE_NONCE_DISCRIMINATOR = Buffer.from([0x04, 0x00, 0x00, 0x00]);
const TRANSFER_CHECKED_DISCRIMINATOR = 12;

const u64ToLeBytes = (value: bigint): Buffer => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
};

export interface BuildSplTransferParams {
  tokenOwner: Uint8Array;
  sourceAta: Uint8Array;
  mint: Uint8Array;
  decimals: number;
  nonce: Uint8Array;
  nonceAccount: Uint8Array;
  nonceAuthority: Uint8Array;
  destinationWallet: Uint8Array;
  destinationAta: Uint8Array;
  amount: bigint;
}

/**
 * Builds a Solana legacy message encoding:
 *   1. AdvanceNonce instruction
 *   2. CreateAssociatedTokenAccount (idempotent)
 *   3. SPL TransferChecked instruction
 *
 * Two layouts exist depending on whether nonceAuthority and destinationWallet
 * are the same pubkey (which happens in the frontend where the user's Privy
 * wallet is both the nonce authority and the recipient):
 *
 * **11-account layout** (nonceAuthority ≠ destinationWallet — core scripts):
 *   Header: [2, 1, 6, 11]
 *   [0] nonceAuthority (writable signer), [1] tokenOwner (readonly signer),
 *   [2] nonceAccount (writable), [3] destinationAta (writable),
 *   [4] sourceAta (writable), [5] SYSTEM_PROGRAM, [6] NONCE_SYSVAR,
 *   [7] SPL_ATA_PROGRAM, [8] destinationWallet, [9] mint, [10] SPL_TOKEN_PROGRAM
 *
 * **10-account layout** (nonceAuthority == destinationWallet — frontend):
 *   Header: [2, 1, 5, 10]
 *   [0] nonceAuthority/destinationWallet (writable signer),
 *   [1] tokenOwner (readonly signer), [2] nonceAccount (writable),
 *   [3] destinationAta (writable), [4] sourceAta (writable),
 *   [5] SYSTEM_PROGRAM, [6] NONCE_SYSVAR, [7] SPL_ATA_PROGRAM,
 *   [8] mint, [9] SPL_TOKEN_PROGRAM
 *   destinationWallet reuses index 0 to avoid Solana's "Account loaded twice" error.
 */
export const buildSplTransfer = ({
  tokenOwner,
  sourceAta,
  mint,
  decimals,
  nonce,
  nonceAccount,
  nonceAuthority,
  destinationWallet,
  destinationAta,
  amount,
}: BuildSplTransferParams): Uint8Array => {
  const sameAuthAndDest =
    nonceAuthority.length === destinationWallet.length &&
    nonceAuthority.every((b, i) => b === destinationWallet[i]);

  if (sameAuthAndDest) {
    // 10-account layout: destinationWallet reuses index 0 (nonceAuthority)
    return Buffer.concat([
      Buffer.from([2, 1, 5, 10]),
      nonceAuthority, // [0] signer — also destinationWallet
      tokenOwner, // [1] signer (dWallet Solana address)
      nonceAccount, // [2] writable
      destinationAta, // [3] writable
      sourceAta, // [4] writable
      SYSTEM_PROGRAM, // [5] readonly
      NONCE_SYSVAR, // [6] readonly
      SPL_ATA_PROGRAM, // [7] readonly
      mint, // [8] readonly (was [9])
      SPL_TOKEN_PROGRAM, // [9] readonly (was [10])
      nonce,
      Buffer.from([3]),
      // AdvanceNonce — unchanged
      Buffer.from([5, 3, 2, 6, 0, 4]),
      ADVANCE_NONCE_DISCRIMINATOR,
      // CreateATA — destWallet 8→0, mint 9→8, SPL_TOKEN 10→9
      Buffer.from([7, 6, 0, 3, 0, 8, 5, 9, 1, 1]),
      // TransferChecked — progId 10→9, mint 9→8
      Buffer.from([9, 4, 4, 8, 3, 1, 10, TRANSFER_CHECKED_DISCRIMINATOR]),
      u64ToLeBytes(amount),
      Buffer.from([decimals]),
    ]);
  }

  // 11-account layout: nonceAuthority and destinationWallet are distinct
  return Buffer.concat([
    Buffer.from([2, 1, 6, 11]),
    nonceAuthority, // [0] signer (user's Solana wallet)
    tokenOwner, // [1] signer (dWallet Solana address)
    nonceAccount, // [2] writable
    destinationAta, // [3] writable
    sourceAta, // [4] writable
    SYSTEM_PROGRAM, // [5] readonly
    NONCE_SYSVAR, // [6] readonly
    SPL_ATA_PROGRAM, // [7] readonly
    destinationWallet, // [8] readonly
    mint, // [9] readonly
    SPL_TOKEN_PROGRAM, // [10] readonly
    nonce,
    Buffer.from([3]),
    // AdvanceNonce
    Buffer.from([5, 3, 2, 6, 0, 4]),
    ADVANCE_NONCE_DISCRIMINATOR,
    // CreateATA (idempotent)
    Buffer.from([7, 6, 0, 3, 8, 9, 5, 10, 1, 1]),
    // TransferChecked
    Buffer.from([10, 4, 4, 9, 3, 1, 10, TRANSFER_CHECKED_DISCRIMINATOR]),
    u64ToLeBytes(amount),
    Buffer.from([decimals]),
  ]);
};
