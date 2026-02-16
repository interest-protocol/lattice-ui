import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config.server', () => ({
  ENCLAVE_URL: 'https://enclave.test',
  ENCLAVE_API_KEY: 'test-enclave-key',
}));

vi.mock('@/lib/api/fetch-with-retry', () => ({
  fetchWithRetry: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

const { fetchWithRetry } = await import('@/lib/api/fetch-with-retry');
const mockFetchWithRetry = vi.mocked(fetchWithRetry);

const { newRequest, voteBurn, voteMint, checkHealth } = await import(
  '../server'
);

const okJson = (data: unknown) => ({
  ok: true,
  json: async () => data,
  text: async () => JSON.stringify(data),
});

describe('enclavePost (no retry)', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('newRequest sends POST with auth headers', async () => {
    const mockResult = { signature: 'sig', response: {} };
    mockFetch.mockResolvedValue(okJson(mockResult));

    const result = await newRequest({
      digest: 'abc',
      chain_id: 1,
    });

    expect(result).toEqual(mockResult);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://enclave.test/new_request',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-enclave-key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    });

    await expect(
      newRequest({ digest: 'abc', chain_id: 1 })
    ).rejects.toThrow('Internal error');
  });

  it('attaches status to thrown error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
      text: async () => 'Bad gateway',
    });

    try {
      await newRequest({ digest: 'abc', chain_id: 1 });
      expect.unreachable('should have thrown');
    } catch (err: unknown) {
      expect((err as { status: number }).status).toBe(502);
    }
  });
});

describe('enclavePostWithRetry', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('voteBurn uses fetchWithRetry', async () => {
    const mockResult = { signature: 'sig', timestamp_ms: 123 };
    mockFetchWithRetry.mockResolvedValue(okJson(mockResult) as Response);

    const result = await voteBurn({ request_id: 'r1' });

    expect(result).toEqual(mockResult);
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      'https://enclave.test/xbridge/vote_burn',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-enclave-key',
        }),
      })
    );
  });

  it('voteMint uses fetchWithRetry', async () => {
    const mockResult = { signature: 'sig', timestamp_ms: 456 };
    mockFetchWithRetry.mockResolvedValue(okJson(mockResult) as Response);

    const result = await voteMint({ request_id: 'r2' });

    expect(result).toEqual(mockResult);
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      'https://enclave.test/xbridge/vote_mint',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('checkHealth', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  it('returns true when enclave is healthy', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
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

  it('calls health_check endpoint without auth', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    await checkHealth();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://enclave.test/health_check',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toBeUndefined();
  });
});
