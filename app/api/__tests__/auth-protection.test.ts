import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// =============================================================================
// Global mocks — prevent heavy SDK imports from failing
// =============================================================================

const mockAuthenticateRequest = vi.fn();
const mockVerifyUserMatch = vi.fn();

vi.mock('@/lib/api/auth', () => ({
  authenticateRequest: (req: unknown) => mockAuthenticateRequest(req),
  verifyUserMatch: (...args: unknown[]) => mockVerifyUserMatch(...args),
}));

// Privy
vi.mock('@/lib/privy/server', () => ({
  getPrivyClient: () => ({}),
}));
vi.mock('@/lib/privy/wallet', () => ({
  getOrCreateWallet: vi.fn(),
  getFirstWallet: vi.fn(),
  walletAddressKey: vi.fn(),
  WalletNotFoundError: class extends Error {},
}));
vi.mock('@/lib/privy/signing', () => ({
  signAndExecuteSuiTransaction: vi.fn(),
  extractPublicKey: vi.fn(),
  authorizationContext: {},
}));

// SDK stubs
vi.mock('@/lib/xswap', () => ({
  createXSwapSdk: () => ({ suiClient: {}, xswap: {} }),
}));
vi.mock('@/lib/xbridge', () => ({
  createXBridgeSdk: () => ({ suiClient: {}, xbridge: {} }),
  ENCLAVE_OBJECT_ID: '0x0',
}));
vi.mock('@/lib/xbridge/client', () => ({
  createXBridgeClient: vi.fn(),
}));
vi.mock('@/lib/registry', () => ({
  createRegistrySdk: () => ({ suiClient: {}, registry: {} }),
  Registry: { createSolanaLinkMessage: () => new Uint8Array() },
  SolanaPubkey: class {},
  SuiAddress: class {},
}));

// Chain SDKs
vi.mock('@mysten/sui/transactions', () => ({
  Transaction: class {},
}));
vi.mock('@mysten/sui/utils', () => ({
  SUI_TYPE_ARG: '0x2::sui::SUI',
}));
vi.mock('@noble/curves/ed25519', () => ({
  ed25519: { verify: vi.fn() },
}));
vi.mock('bs58', () => ({
  default: { decode: vi.fn().mockReturnValue(new Uint8Array(32)) },
}));

// Solana
vi.mock('@solana/kit', () => ({
  address: vi.fn(),
  pipe: vi.fn(),
  createNoopSigner: vi.fn(),
  createTransactionMessage: vi.fn(),
  setTransactionMessageFeePayer: vi.fn(),
  setTransactionMessageLifetimeUsingBlockhash: vi.fn(),
  appendTransactionMessageInstruction: vi.fn(),
  compileTransaction: vi.fn(),
  getBase64EncodedWireTransaction: vi.fn(),
}));
vi.mock('@solana-program/system', () => ({
  getTransferSolInstruction: vi.fn(),
  getCreateAccountWithSeedInstruction: vi.fn(),
  getInitializeNonceAccountInstruction: vi.fn(),
  getNonceSize: () => 80,
  fetchMaybeNonce: vi.fn(),
  NonceState: { Initialized: 'Initialized' },
  SYSTEM_PROGRAM_ADDRESS: '11111111111111111111111111111111',
}));
vi.mock('@solana-program/token', () => ({
  getTransferInstruction: vi.fn(),
  findAssociatedTokenPda: vi.fn().mockResolvedValue(['ata-address']),
  TOKEN_PROGRAM_ADDRESS: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
}));
vi.mock('@interest-protocol/xswap-sdk', () => ({
  XSWAP_TYPE: 'xswap-type',
}));
vi.mock('@interest-protocol/xbridge-sdk', () => ({
  ChainId: { Solana: 1 },
  DWalletAddress: { 1: 'dwallet-address' },
  WalletKey: { 1: 'wallet-key' },
  WITNESS_TYPE: 'witness-type',
  WRAPPED_SOL_OTW: 'wrapped-sol',
}));

// Server config
vi.mock('@/lib/config.server', () => ({
  PRIVY_AUTHORIZATION_KEY: 'test-key',
  PRIVY_APP_SECRET: 'test-secret',
  ENCLAVE_URL: 'http://localhost:8080',
  ENCLAVE_API_KEY: 'test-enclave-key',
  SOLVER_API_KEY: 'test-solver-key',
}));
vi.mock('@/lib/config', () => ({
  SOLVER_API_URL: 'http://localhost:9090',
}));

// Misc
vi.mock('@/lib/api/with-timeout', () => ({
  withTimeout: vi.fn((_p: unknown) => _p),
}));
vi.mock('@/lib/api/fetch-with-retry', () => ({
  fetchWithRetry: vi.fn(),
}));
vi.mock('@/lib/bigint-utils', () => ({
  parseUnits: () => 0n,
  formatUnits: () => '0',
}));
vi.mock('@/lib/sui/client', () => ({
  getSuiClient: () => ({}),
}));
vi.mock('@/lib/solana/server', () => ({
  getSolanaRpc: () => ({}),
}));
vi.mock('@/lib/solana/nonce', () => ({
  deriveNonceAddress: vi.fn(),
  NONCE_SEED: 'nonce',
}));
vi.mock('@/lib/solana/spl-message', () => ({
  buildSplTransfer: vi.fn().mockReturnValue(new Uint8Array(32)),
}));
vi.mock('@/lib/solana/confirm-transaction', () => ({
  confirmSolanaTransaction: vi.fn(),
}));
vi.mock('@/constants/chains', () => ({
  CHAIN_REGISTRY: {
    sui: { minGas: 0.01, decimals: 9 },
    solana: { minGas: 0.00001, decimals: 9 },
  },
}));
vi.mock('@/constants/bridged-tokens', () => ({
  WSOL_SUI_TYPE: '0x::wsol::WSOL',
}));
vi.mock('@/constants/coins', () => ({
  NATIVE_SOL_MINT: 'So11111111111111111111111111111111111111112',
  SOL_DECIMALS: 9,
}));
vi.mock('@/utils/sui', () => ({
  coinTypeEquals: vi.fn(),
  normalizeSuiAddress: vi.fn(),
}));

// =============================================================================
// Route table
// =============================================================================

interface ProtectedRoute {
  name: string;
  importPath: string;
  method: 'GET' | 'POST';
  requiresUserId: boolean;
  body?: Record<string, unknown>;
}

const PROTECTED_ROUTES: ProtectedRoute[] = [
  {
    name: 'wallet/create-sui',
    importPath: '@/app/api/wallet/create-sui/route',
    method: 'POST',
    requiresUserId: true,
    body: { userId: 'user-123' },
  },
  {
    name: 'wallet/create-solana',
    importPath: '@/app/api/wallet/create-solana/route',
    method: 'POST',
    requiresUserId: true,
    body: { userId: 'user-123' },
  },
  {
    name: 'wallet/send-sui',
    importPath: '@/app/api/wallet/send-sui/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      recipient:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      amount: '1000',
    },
  },
  {
    name: 'wallet/send-solana',
    importPath: '@/app/api/wallet/send-solana/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      recipient: 'SoLaNaAdDrEsS111111111111111111111111111111',
      amount: '1000',
    },
  },
  {
    name: 'wallet/link-solana',
    importPath: '@/app/api/wallet/link-solana/route',
    method: 'POST',
    requiresUserId: true,
    body: { userId: 'user-123' },
  },
  {
    name: 'wallet/create-nonce',
    importPath: '@/app/api/wallet/create-nonce/route',
    method: 'POST',
    requiresUserId: true,
    body: { userId: 'user-123' },
  },
  {
    name: 'xswap/create-request',
    importPath: '@/app/api/xswap/create-request/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      proof: {
        signature: [1],
        digest: [2],
        timestampMs: '100',
        dwalletAddress: [3],
        user: [4],
        chainId: 1,
        token: [5],
        amount: '100',
      },
      walletKey: '1',
      sourceAddress: [1],
      sourceChain: 1,
      destinationChain: 2,
      destinationAddress: [2],
      destinationToken: [3],
      minDestinationAmount: '100',
      minConfirmations: 1,
      deadline: '999999',
      solverSender: [4],
      solverRecipient: [5],
    },
  },
  {
    name: 'xbridge/bridge-mint',
    importPath: '@/app/api/xbridge/bridge-mint/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      sourceChain: 1,
      sourceToken: [1],
      sourceDecimals: 9,
      sourceAddress: [2],
      sourceAmount: '1000',
      coinType: '0x::test::TEST',
      depositSignature: 'sig123',
    },
  },
  {
    name: 'xbridge/bridge-burn',
    importPath: '@/app/api/xbridge/bridge-burn/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      sourceAmount: '1000',
      destinationAddress: [1, 2, 3],
      nonceAddress: 'nonce-addr',
      coinType: '0x::test::TEST',
    },
  },
  {
    name: 'xbridge/broadcast-burn',
    importPath: '@/app/api/xbridge/broadcast-burn/route',
    method: 'POST',
    requiresUserId: true,
    body: {
      userId: 'user-123',
      requestId: 'req-1',
      signId: 'sign-1',
      userSignature: 'aabb',
      message: 'ccdd',
    },
  },
  {
    name: 'enclave/new-request',
    importPath: '@/app/api/enclave/new-request/route',
    method: 'POST',
    requiresUserId: false,
    body: { digest: 'abc', chainId: 1 },
  },
  {
    name: 'solver/fulfill',
    importPath: '@/app/api/solver/fulfill/route',
    method: 'POST',
    requiresUserId: false,
    body: { requestId: 'req-1', userAddress: '0xabc' },
  },
  {
    name: 'wallet/check-registration',
    importPath: '@/app/api/wallet/check-registration/route',
    method: 'GET',
    requiresUserId: false,
  },
];

// =============================================================================
// Tests
// =============================================================================

describe('Auth protection — protected routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const route of PROTECTED_ROUTES) {
    describe(`${route.method} /api/${route.name}`, () => {
      const makeRequest = () => {
        if (route.method === 'GET') {
          return new NextRequest(
            `http://localhost:3000/api/${route.name}`,
            { method: 'GET' }
          );
        }
        return new NextRequest(
          `http://localhost:3000/api/${route.name}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(route.body),
          }
        );
      };

      it('returns 401 when no token is provided', async () => {
        mockAuthenticateRequest.mockResolvedValue(
          NextResponse.json(
            { error: 'Missing authorization token' },
            { status: 401 }
          )
        );

        const mod = await import(route.importPath);
        const handler = mod[route.method];
        const res = await handler(makeRequest());

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Missing authorization token');
      });

      it('returns 401 when token is invalid/expired', async () => {
        mockAuthenticateRequest.mockResolvedValue(
          NextResponse.json(
            { error: 'Invalid or expired token' },
            { status: 401 }
          )
        );

        const mod = await import(route.importPath);
        const handler = mod[route.method];
        const res = await handler(makeRequest());

        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error).toBe('Invalid or expired token');
      });

      if (route.requiresUserId) {
        it('returns 403 when userId does not match authenticated user', async () => {
          mockAuthenticateRequest.mockResolvedValue({
            userId: 'user-123',
            accessToken: 'tok',
          });
          mockVerifyUserMatch.mockReturnValue(
            NextResponse.json(
              { error: 'User ID mismatch' },
              { status: 403 }
            )
          );

          const mod = await import(route.importPath);
          const handler = mod[route.method];
          const res = await handler(makeRequest());

          expect(res.status).toBe(403);
          const body = await res.json();
          expect(body.error).toBe('User ID mismatch');
        });
      }
    });
  }
});

describe('Auth protection — public routes (no auth required)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch for public routes that call external services
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({ status: 'healthy', data: [], parsed: [] }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const PUBLIC_ROUTES = [
    {
      name: 'health',
      importPath: '@/app/api/health/route',
      method: 'GET' as const,
    },
    {
      name: 'health/enclave',
      importPath: '@/app/api/health/enclave/route',
      method: 'GET' as const,
    },
    {
      name: 'health/solver',
      importPath: '@/app/api/health/solver/route',
      method: 'GET' as const,
    },
    {
      name: 'solver/metadata',
      importPath: '@/app/api/solver/metadata/route',
      method: 'GET' as const,
    },
    {
      name: 'solver/prices',
      importPath: '@/app/api/solver/prices/route',
      method: 'GET' as const,
    },
    {
      name: 'solver/status',
      importPath: '@/app/api/solver/status/route',
      method: 'GET' as const,
      url: 'http://localhost:3000/api/solver/status?requestId=test-123',
    },
    {
      name: 'external/prices',
      importPath: '@/app/api/external/prices/route',
      method: 'POST' as const,
      body: { coins: ['sui', 'sol'] },
    },
  ];

  for (const route of PUBLIC_ROUTES) {
    it(`${route.method} /api/${route.name} responds without auth`, async () => {
      const mod = await import(route.importPath);
      const handler = mod[route.method];

      let req: NextRequest;
      if (route.method === 'POST') {
        req = new NextRequest(
          `http://localhost:3000/api/${route.name}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
              (route as { body?: unknown }).body ?? {}
            ),
          }
        );
      } else {
        req = new NextRequest(
          (route as { url?: string }).url ??
            `http://localhost:3000/api/${route.name}`,
          { method: 'GET' }
        );
      }

      const res = await handler(req);

      // Public routes must NOT return 401
      expect(res.status).not.toBe(401);
      // Confirm authenticateRequest was never called for these routes
      expect(mockAuthenticateRequest).not.toHaveBeenCalled();
    });
  }
});
