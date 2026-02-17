import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  SOLVER_API_URL: 'https://solver.test',
}));

vi.mock('@/lib/config.server', () => ({
  SOLVER_API_KEY: 'test-key',
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const {
  getMetadata,
  getPrices,
  getRequestStatus,
  fulfill,
  sign,
  checkHealth,
} = await import('../server');

const okJson = (data: unknown) => ({
  ok: true,
  json: async () => ({ data }),
});

const errorJson = (status: number, body?: unknown) => ({
  ok: false,
  status,
  json: async () => body ?? null,
});

describe('solverGet', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('getMetadata unwraps json.data', async () => {
    const mockData = {
      solver: { sui: 'addr1', solana: 'addr2' },
      chains: [
        { chainId: 3, name: 'Sui', rpcUrl: 'https://rpc.test/sui', nativeToken: { address: '0x2::sui::SUI', decimals: 9, symbol: 'SUI' } },
        { chainId: 1, name: 'Solana', rpcUrl: 'https://rpc.test/sol', nativeToken: { address: 'So11111111111111111111111111111111111111112', decimals: 9, symbol: 'SOL' } },
      ],
      supportedPairs: [{ source: 3, destination: 1 }, { source: 1, destination: 3 }],
    };
    mockFetch.mockResolvedValue(okJson(mockData));

    const result = await getMetadata();
    expect(result).toEqual(mockData);
  });

  it('passes x-api-key header', async () => {
    mockFetch.mockResolvedValue(okJson({}));

    await getMetadata();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://solver.test/api/v1/metadata',
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-api-key': 'test-key' }),
      })
    );
  });

  it('getPrices calls correct endpoint', async () => {
    mockFetch.mockResolvedValue(okJson({ sui: 1.5, sol: 100 }));

    const result = await getPrices();
    expect(result).toEqual({ sui: 1.5, sol: 100 });
    expect(mockFetch).toHaveBeenCalledWith(
      'https://solver.test/api/v1/prices',
      expect.anything()
    );
  });

  it('getRequestStatus interpolates requestId', async () => {
    mockFetch.mockResolvedValue(okJson({ status: 'settled' }));

    await getRequestStatus('req-123');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://solver.test/api/v1/requests/req-123',
      expect.anything()
    );
  });

  it('throws with upstream error message on non-ok', async () => {
    mockFetch.mockResolvedValue(
      errorJson(502, { error: 'upstream down' })
    );

    await expect(getMetadata()).rejects.toThrow('upstream down');
  });

  it('throws with fallback message when no upstream body', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('no body');
      },
    });

    await expect(getMetadata()).rejects.toThrow(
      'Solver API /api/v1/metadata failed (500)'
    );
  });

  it('attaches status to thrown error', async () => {
    mockFetch.mockResolvedValue(errorJson(503, { error: 'unavailable' }));

    try {
      await getMetadata();
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      expect((err as { status: number }).status).toBe(503);
    }
  });
});

describe('solverPost', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('fulfill sends POST with body and unwraps data', async () => {
    const mockResult = { requestId: 'r1', sourceChain: 'sui' };
    mockFetch.mockResolvedValue(okJson(mockResult));

    const result = await fulfill({
      requestId: 'r1',
      userAddress: 'addr',
    });

    expect(result).toEqual(mockResult);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      requestId: 'r1',
      userAddress: 'addr',
    });
  });

  it('sign returns signature string', async () => {
    mockFetch.mockResolvedValue(
      okJson({ signature: '0xdeadbeef' })
    );

    const sig = await sign({
      presign: 'aabb',
      message: 'ccdd',
      chain: 'solana',
    });

    expect(sig).toBe('0xdeadbeef');
  });

  it('sign throws invariant on missing signature', async () => {
    mockFetch.mockResolvedValue(okJson({}));

    await expect(
      sign({ presign: 'aa', message: 'bb', chain: 'solana' })
    ).rejects.toThrow('Solver API returned an invalid signature response');
  });

  it('sign throws invariant on empty signature', async () => {
    mockFetch.mockResolvedValue(okJson({ signature: '' }));

    await expect(
      sign({ presign: 'aa', message: 'bb', chain: 'solana' })
    ).rejects.toThrow('Solver API returned an invalid signature response');
  });
});

describe('checkHealth', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns true when solver is healthy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    expect(await checkHealth()).toBe(true);
  });

  it('returns false on non-ok response', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    expect(await checkHealth()).toBe(false);
  });

  it('returns false on fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));

    expect(await checkHealth()).toBe(false);
  });

  it('does not send x-api-key header', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    await checkHealth();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toBeUndefined();
  });
});
