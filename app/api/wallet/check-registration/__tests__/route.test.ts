import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

const mockAuthenticateRequest = vi.fn();
const mockGetPrivyClient = vi.fn();
const mockCreateRegistrySdk = vi.fn();

vi.mock('@/lib/api/auth', () => ({
  authenticateRequest: (req: unknown) => mockAuthenticateRequest(req),
}));

vi.mock('@/lib/privy/server', () => ({
  getPrivyClient: () => mockGetPrivyClient(),
}));

vi.mock('@/lib/registry', () => ({
  createRegistrySdk: () => mockCreateRegistrySdk(),
  SuiAddress: class {},
}));

vi.mock('@/lib/config.server', () => ({
  PRIVY_AUTHORIZATION_KEY: 'test-auth-key',
  PRIVY_APP_SECRET: 'test-secret',
}));

// Import after mocks
const { GET } = await import('../route');

// --- Helpers ---

const makeRequest = () =>
  new NextRequest('http://localhost:3000/api/wallet/check-registration', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-token' },
  });

// --- Tests ---

describe('GET /api/wallet/check-registration', () => {
  const mockRegistry = {
    getSolanaForSui: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockAuthenticateRequest.mockResolvedValue({
      userId: 'user-123',
      accessToken: 'test-token',
    });

    mockCreateRegistrySdk.mockReturnValue({
      registry: mockRegistry,
      suiClient: {},
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns not registered when no wallets exist', async () => {
    mockGetPrivyClient.mockReturnValue({
      users: () => ({
        _get: vi.fn().mockResolvedValue({ custom_metadata: undefined }),
      }),
    });

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registered).toBe(false);
    expect(body.suiAddress).toBeNull();
    expect(body.solanaAddress).toBeNull();
    expect(body.hasWallets).toBe(false);
  });

  it('returns not registered when wallets exist but not linked on-chain', async () => {
    mockGetPrivyClient.mockReturnValue({
      users: () => ({
        _get: vi.fn().mockResolvedValue({
          custom_metadata: {
            suiAddress: '0xsui-address',
            solanaAddress: 'solana-address',
          },
        }),
      }),
    });

    mockRegistry.getSolanaForSui.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registered).toBe(false);
    expect(body.suiAddress).toBe('0xsui-address');
    expect(body.solanaAddress).toBe('solana-address');
    expect(body.hasWallets).toBe(true);
  });

  it('returns registered when wallets are linked on-chain', async () => {
    mockGetPrivyClient.mockReturnValue({
      users: () => ({
        _get: vi.fn().mockResolvedValue({
          custom_metadata: {
            suiAddress: '0xsui-address',
            solanaAddress: 'solana-address',
          },
        }),
      }),
    });

    mockRegistry.getSolanaForSui.mockResolvedValue([
      { toBs58: () => 'solana-linked-address' },
    ]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.registered).toBe(true);
    expect(body.suiAddress).toBe('0xsui-address');
    expect(body.solanaAddress).toBe('solana-linked-address');
    expect(body.hasWallets).toBe(true);
  });
});
