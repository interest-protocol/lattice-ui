import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

const mockGetPrivyClient = vi.fn();
const mockGetOrCreateWallet = vi.fn();
const mockSignAndExecuteSuiTransaction = vi.fn();
const mockCreateRegistrySdk = vi.fn();
const mockAuthenticateRequest = vi.fn();
const mockVerifyUserMatch = vi.fn();

vi.mock('@noble/curves/ed25519', () => ({
  ed25519: {
    verify: vi.fn().mockReturnValue(true),
  },
}));

vi.mock('@/lib/privy/server', () => ({
  getPrivyClient: () => mockGetPrivyClient(),
}));

vi.mock('@/lib/privy/wallet', () => ({
  getOrCreateWallet: (...args: unknown[]) => mockGetOrCreateWallet(...args),
}));

vi.mock('@/lib/privy/signing', () => ({
  signAndExecuteSuiTransaction: (...args: unknown[]) =>
    mockSignAndExecuteSuiTransaction(...args),
  authorizationContext: {
    authorization_private_keys: ['test-auth-key'],
  },
}));

vi.mock('@/lib/registry', () => ({
  createRegistrySdk: () => mockCreateRegistrySdk(),
  Registry: {
    createSolanaLinkMessage: () => new Uint8Array([1, 2, 3]),
  },
  SolanaPubkey: class {},
  SuiAddress: class {},
}));

vi.mock('@/lib/api/auth', () => ({
  authenticateRequest: (req: unknown) => mockAuthenticateRequest(req),
  verifyUserMatch: (...args: unknown[]) => mockVerifyUserMatch(...args),
}));

vi.mock('@/lib/config.server', () => ({
  PRIVY_AUTHORIZATION_KEY: 'test-auth-key',
}));

vi.mock('@/constants/chains', () => ({
  CHAIN_REGISTRY: {
    sui: { minGas: 1, decimals: 9 },
    solana: { minGas: 0.00001, decimals: 9 },
  },
}));

vi.mock('@/lib/bigint-utils', () => ({
  parseUnits: (value: string, decimals: number) => {
    const [intPart = '0', fracPart = ''] = value.split('.');
    const trimmedFrac = fracPart.slice(0, decimals).padEnd(decimals, '0');
    return BigInt(intPart) * 10n ** BigInt(decimals) + BigInt(trimmedFrac);
  },
}));

// Import after mocks
const { POST } = await import('../route');

// --- Helpers ---

const makeRequest = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost:3000/api/wallet/link-solana', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const mockSuiClient = {
  getBalance: vi.fn(),
  waitForTransaction: vi.fn(),
};

const mockRegistry = {
  getSolanaForSui: vi.fn(),
  linkSolana: vi.fn(),
};

const mockSignMessage = vi.fn().mockResolvedValue({
  signature: Buffer.from('test-sig').toString('base64'),
});

const mockPrivy = {
  wallets: () => ({
    solana: () => ({
      signMessage: mockSignMessage,
    }),
  }),
};

// --- Tests ---

describe('POST /api/wallet/link-solana', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthenticateRequest.mockResolvedValue({
      userId: 'user-123',
      accessToken: 'token',
    });
    mockVerifyUserMatch.mockReturnValue(null);

    mockGetPrivyClient.mockReturnValue(mockPrivy);

    mockGetOrCreateWallet.mockImplementation((_privy, _userId, chain) => {
      if (chain === 'sui')
        return Promise.resolve({
          id: 'sui-wallet-id',
          address: '0xabc123',
          public_key: 'sui-pub-key',
        });
      return Promise.resolve({
        id: 'sol-wallet-id',
        address: 'SoLaNaAdDrEsS111111111111111111111111111111',
        public_key: 'sol-pub-key',
      });
    });

    mockCreateRegistrySdk.mockReturnValue({
      suiClient: mockSuiClient,
      registry: mockRegistry,
    });

    mockRegistry.getSolanaForSui.mockResolvedValue([]);
    mockSuiClient.getBalance.mockResolvedValue({
      totalBalance: '2000000000',
    });
    mockSuiClient.waitForTransaction.mockResolvedValue({});

    const mockTx = {
      setSender: vi.fn(),
      build: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
    };
    mockRegistry.linkSolana.mockReturnValue(mockTx);

    mockSignAndExecuteSuiTransaction.mockResolvedValue({
      digest: 'tx-digest-123',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 401 when authentication fails', async () => {
    const { NextResponse } = await import('next/server');
    mockAuthenticateRequest.mockResolvedValue(
      NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      )
    );

    const res = await POST(makeRequest({ userId: 'user-123' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user ID does not match', async () => {
    const { NextResponse } = await import('next/server');
    mockVerifyUserMatch.mockReturnValue(
      NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    );

    const res = await POST(makeRequest({ userId: 'user-456' }));
    expect(res.status).toBe(403);
  });

  it('returns 402 with INSUFFICIENT_GAS when balance is too low', async () => {
    mockSuiClient.getBalance.mockResolvedValue({
      totalBalance: '100000000',
    });

    const res = await POST(makeRequest({ userId: 'user-123' }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.code).toBe('INSUFFICIENT_GAS');
  });

  it('returns success with alreadyLinked when on-chain link exists', async () => {
    mockRegistry.getSolanaForSui.mockResolvedValue([
      { toBs58: () => 'SoLaNaLinKeD111111111111111111111111111111' },
    ]);

    const res = await POST(makeRequest({ userId: 'user-123' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.alreadyLinked).toBe(true);
    expect(body.solanaAddress).toBe(
      'SoLaNaLinKeD111111111111111111111111111111'
    );
  });

  it('returns digest and addresses on successful link', async () => {
    // Second call (post-tx verification) returns the new link
    mockRegistry.getSolanaForSui
      .mockResolvedValueOnce([]) // idempotency check
      .mockResolvedValueOnce([
        { toBs58: () => 'SoLaNaAdDrEsS111111111111111111111111111111' },
      ]); // verification

    const res = await POST(makeRequest({ userId: 'user-123' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.digest).toBe('tx-digest-123');
    expect(body.suiAddress).toBe('0xabc123');
    expect(body.solanaAddress).toBe(
      'SoLaNaAdDrEsS111111111111111111111111111111'
    );
  });

  it('returns 402 when tx execution throws a gas error', async () => {
    mockSignAndExecuteSuiTransaction.mockRejectedValue(
      new Error('GasBalanceTooLow: not enough gas')
    );

    const res = await POST(makeRequest({ userId: 'user-123' }));
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.code).toBe('INSUFFICIENT_GAS');
  });

  it('returns 500 when local signature verification fails', async () => {
    const { ed25519 } = await import('@noble/curves/ed25519');
    vi.mocked(ed25519.verify).mockReturnValueOnce(false);

    const res = await POST(makeRequest({ userId: 'user-123' }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Solana signature verification failed locally');
  });

  it('returns 500 on unexpected error', async () => {
    mockSignAndExecuteSuiTransaction.mockRejectedValue(
      new Error('Network timeout')
    );

    const res = await POST(makeRequest({ userId: 'user-123' }));
    expect(res.status).toBe(500);
  });
});
