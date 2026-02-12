/**
 * Builds a raw Solana legacy message (425 bytes) encoding:
 *   1. AdvanceNonce instruction
 *   2. SPL TransferChecked instruction
 *
 * This is used for the wSOL→SOL burn flow, where the message is signed
 * by both the user (nonceAuthority) and the dWallet (tokenOwner).
 *
 * Ported from core/scripts/src/flows/xbridge/wsol-to-sol/1-create-burn-request.ts
 */

const SPL_TOKEN_PROGRAM = Buffer.from(
  '06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9',
  'hex'
);
const SPL_ATA_PROGRAM = Buffer.from(
  '8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859',
  'hex'
);
const SYSTEM_PROGRAM = Buffer.alloc(32, 0);
const NONCE_SYSVAR = Buffer.from(
  '06a7d517192c568ee08a845f73d29788cf035c3145b21ab344d8062ea9400000',
  'hex'
);
const ADVANCE_NONCE_DISCRIMINATOR = Buffer.from([0x04, 0x00, 0x00, 0x00]);
const TRANSFER_CHECKED_DISCRIMINATOR = 12;

const u64ToLeBytes = (value: bigint): Buffer => {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(value, 0);
  return buf;
};

export interface BuildSplTransferParams {
  tokenOwner: Buffer;
  sourceAta: Buffer;
  mint: Buffer;
  decimals: number;
  nonce: Buffer;
  nonceAccount: Buffer;
  nonceAuthority: Buffer;
  destinationWallet: Buffer;
  destinationAta: Buffer;
  amount: bigint;
}

/**
 * Builds a 425-byte Solana legacy message with:
 * - Header: [2 signers, 1 readonly signer, 6 readonly non-signers, 11 accounts]
 * - Account keys (0-10): nonceAuthority, tokenOwner, nonceAccount, destinationAta,
 *   sourceAta, SYSTEM_PROGRAM, NONCE_SYSVAR, SPL_ATA_PROGRAM, destinationWallet,
 *   mint, SPL_TOKEN_PROGRAM
 * - Nonce value (32 bytes, replaces recent blockhash)
 * - 3 instructions: AdvanceNonce, CreateATA (idempotent), TransferChecked
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
}: BuildSplTransferParams): Buffer =>
  Buffer.concat([
    // Message header: [numSigners, numReadonlySigners, numReadonlyUnsigned, numAccounts]
    Buffer.from([2, 1, 6, 11]),
    // Account keys (32 bytes each, 11 total)
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
    // Recent blockhash (replaced by nonce value)
    nonce,
    // Instruction count
    Buffer.from([3]),
    // Instruction 1: AdvanceNonce
    // programIdIndex=5 (SYSTEM_PROGRAM), 3 accounts, 4 bytes data
    Buffer.from([5, 3, 2, 6, 0, 4]),
    ADVANCE_NONCE_DISCRIMINATOR,
    // Instruction 2: CreateAssociatedTokenAccount (idempotent)
    // programIdIndex=7 (SPL_ATA_PROGRAM), 6 accounts, no data
    Buffer.from([7, 6, 0, 3, 8, 9, 5, 10, 1, 1]),
    // Instruction 3: TransferChecked
    // programIdIndex=10 (SPL_TOKEN_PROGRAM), 4 accounts, 10 bytes data
    Buffer.from([10, 4, 4, 9, 3, 1, 10, TRANSFER_CHECKED_DISCRIMINATOR]),
    u64ToLeBytes(amount),
    Buffer.from([decimals]),
  ]);
