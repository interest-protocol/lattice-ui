import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { toBase64, toHex } from '@mysten/sui/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config.server', () => ({
  PRIVY_AUTHORIZATION_KEY: 'test-auth-key',
}));

const { extractPublicKey, getWalletPublicKey, signAndExecuteSuiTransaction } =
  await import('../signing');

describe('extractPublicKey', () => {
  const VALID_32_BYTES = new Uint8Array(32).fill(0xab);
  const VALID_HEX = toHex(VALID_32_BYTES);

  it('parses a 64-char hex string as a 32-byte Ed25519 key', () => {
    const key = extractPublicKey(VALID_HEX);
    expect(key).toBeInstanceOf(Ed25519PublicKey);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });

  it('parses a hex string with 0x prefix', () => {
    const key = extractPublicKey(`0x${VALID_HEX}`);
    expect(key).toBeInstanceOf(Ed25519PublicKey);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });

  it('parses hex with flag byte prefix (33 bytes → extracts last 32)', () => {
    const withFlag = new Uint8Array(33);
    withFlag[0] = 0x00; // ED25519 flag byte
    withFlag.set(VALID_32_BYTES, 1);
    const hexWithFlag = toHex(withFlag);

    const key = extractPublicKey(hexWithFlag);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });

  it('parses a base64-encoded 32-byte key', () => {
    const b64 = toBase64(VALID_32_BYTES);
    const key = extractPublicKey(b64);
    expect(key).toBeInstanceOf(Ed25519PublicKey);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });

  it('parses a base64-encoded 33-byte key (extracts last 32)', () => {
    const withFlag = new Uint8Array(33);
    withFlag[0] = 0x00;
    withFlag.set(VALID_32_BYTES, 1);
    const b64 = toBase64(withFlag);

    const key = extractPublicKey(b64);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });
});

describe('getWalletPublicKey', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('retrieves wallet and extracts public key', async () => {
    const VALID_32_BYTES = new Uint8Array(32).fill(0xcd);
    const hexKey = toHex(VALID_32_BYTES);

    const mockPrivy = {
      wallets: () => ({
        get: vi.fn().mockResolvedValue({ public_key: hexKey }),
      }),
    };

    const key = await getWalletPublicKey(mockPrivy as never, 'wallet-123');
    expect(key).toBeInstanceOf(Ed25519PublicKey);
    expect(key.toRawBytes()).toEqual(VALID_32_BYTES);
  });

  it('throws when wallet has no public_key', async () => {
    const mockPrivy = {
      wallets: () => ({
        get: vi.fn().mockResolvedValue({ public_key: null }),
      }),
    };

    await expect(
      getWalletPublicKey(mockPrivy as never, 'wallet-456')
    ).rejects.toThrow('Wallet wallet-456 has no public key');
  });
});

describe('signAndExecuteSuiTransaction', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('signs, verifies locally, and executes transaction', async () => {
    const rawBytes = new Uint8Array([1, 2, 3, 4]);
    const fakeSignatureHex = 'ab'.repeat(64); // 64-byte fake signature

    const mockPublicKey = {
      verifyWithIntent: vi.fn().mockResolvedValue(true),
      toSuiBytes: vi.fn().mockReturnValue(new Uint8Array(33).fill(0xaa)),
      toSuiPublicKey: vi.fn().mockReturnValue('base64pubkey'),
      toRawBytes: vi.fn().mockReturnValue(new Uint8Array(32).fill(0xaa)),
      flag: vi.fn().mockReturnValue(0),
    };

    const mockExecuteResult = { digest: 'tx-digest-123', effects: {} };

    const mockPrivy = {
      wallets: () => ({
        rawSign: vi.fn().mockResolvedValue({ signature: fakeSignatureHex }),
        get: vi.fn(),
      }),
    };

    const mockSuiClient = {
      executeTransactionBlock: vi.fn().mockResolvedValue(mockExecuteResult),
    };

    const result = await signAndExecuteSuiTransaction(mockPrivy as never, {
      walletId: 'w1',
      rawBytes,
      suiClient: mockSuiClient as never,
      publicKey: mockPublicKey as unknown as Ed25519PublicKey,
    });

    expect(result).toEqual(mockExecuteResult);
    expect(mockPublicKey.verifyWithIntent).toHaveBeenCalledWith(
      rawBytes,
      expect.any(Uint8Array),
      'TransactionData'
    );
    expect(mockSuiClient.executeTransactionBlock).toHaveBeenCalledWith(
      expect.objectContaining({
        transactionBlock: toBase64(rawBytes),
      })
    );
  });

  it('throws when local signature verification fails', async () => {
    const rawBytes = new Uint8Array([1, 2, 3, 4]);
    const fakeSignatureHex = 'ab'.repeat(64);

    const mockPublicKey = {
      verifyWithIntent: vi.fn().mockResolvedValue(false),
      toSuiBytes: vi.fn().mockReturnValue(new Uint8Array(33).fill(0xaa)),
      toRawBytes: vi.fn().mockReturnValue(new Uint8Array(32).fill(0xaa)),
      flag: vi.fn().mockReturnValue(0),
    };

    const mockPrivy = {
      wallets: () => ({
        rawSign: vi.fn().mockResolvedValue({ signature: fakeSignatureHex }),
      }),
    };

    const mockSuiClient = {
      executeTransactionBlock: vi.fn(),
    };

    await expect(
      signAndExecuteSuiTransaction(mockPrivy as never, {
        walletId: 'w1',
        rawBytes,
        suiClient: mockSuiClient as never,
        publicKey: mockPublicKey as unknown as Ed25519PublicKey,
      })
    ).rejects.toThrow('Signature verification failed locally');

    expect(mockSuiClient.executeTransactionBlock).not.toHaveBeenCalled();
  });

  it('fetches public key from Privy when not provided', async () => {
    const rawBytes = new Uint8Array([1, 2, 3, 4]);
    const fakeSignatureHex = 'ab'.repeat(64);
    const VALID_32_BYTES = new Uint8Array(32).fill(0xef);
    const pubKeyHex = toHex(VALID_32_BYTES);

    const mockWallets = {
      rawSign: vi.fn().mockResolvedValue({ signature: fakeSignatureHex }),
      get: vi.fn().mockResolvedValue({ public_key: pubKeyHex }),
    };

    const mockPrivy = {
      wallets: () => mockWallets,
    };

    const mockSuiClient = {
      executeTransactionBlock: vi.fn().mockResolvedValue({ digest: 'd1' }),
    };

    // This will likely fail verification since the key and signature don't match,
    // but we're testing that it attempts to fetch the key
    try {
      await signAndExecuteSuiTransaction(mockPrivy as never, {
        walletId: 'w1',
        rawBytes,
        suiClient: mockSuiClient as never,
        // publicKey intentionally omitted
      });
    } catch {
      // Expected — signature won't verify with a random key
    }

    expect(mockWallets.get).toHaveBeenCalledWith('w1');
  });
});
