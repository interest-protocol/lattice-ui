import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

vi.mock('@/lib/config', () => ({
  SOLVER_API_URL: 'https://solver.test',
}));

vi.mock('@/lib/config.server', () => ({
  SOLVER_API_KEY: 'test-api-key',
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks
const { GET } = await import('../route');

// --- Tests ---

describe('GET /api/solver/metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns metadata from solver API', async () => {
    const mockData = { chains: ['sui', 'solana'], version: '1.0' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockData }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockData);
  });

  it('passes API key in headers', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await GET();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://solver.test/api/v1/metadata',
      expect.objectContaining({
        headers: { 'x-api-key': 'test-api-key' },
      })
    );
  });

  it('returns error when upstream responds with non-ok status', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe('Failed to fetch metadata');
  });

  it('returns 500 when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Network error');
  });

  it('includes AbortSignal timeout in request', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    await GET();

    const [, init] = mockFetch.mock.calls[0];
    expect(init.signal).toBeDefined();
  });
});
