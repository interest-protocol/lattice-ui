import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  ApiRequestError,
  get,
  post,
  setAccessTokenGetter,
} from '../client';

// --- Helpers ---

const mockFetch = vi.fn();

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// --- Setup ---

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
  vi.spyOn(Math, 'random').mockReturnValue(0); // deterministic jitter
  setAccessTokenGetter(null as unknown as () => Promise<string | null>);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('API client', () => {
  describe('post', () => {
    it('sends POST with JSON body and Content-Type', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await post('/api/test', { foo: 'bar' }, { retries: 0 });

      expect(mockFetch).toHaveBeenCalledOnce();
      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.body).toBe(JSON.stringify({ foo: 'bar' }));
    });

    it('includes auth header when token getter is set', async () => {
      setAccessTokenGetter(async () => 'my-token');
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await post('/api/test', {}, { retries: 0 });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer my-token');
    });

    it('omits auth header when no token getter', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await post('/api/test', {}, { retries: 0 });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Authorization).toBeUndefined();
    });

    it('omits auth header when getter returns null', async () => {
      setAccessTokenGetter(async () => null);
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await post('/api/test', {}, { retries: 0 });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Authorization).toBeUndefined();
    });

    it('merges custom headers', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

      await post('/api/test', {}, {
        retries: 0,
        headers: { 'X-Custom': 'value' },
      });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers['X-Custom']).toBe('value');
      expect(init.headers['Content-Type']).toBe('application/json');
    });

    it('parses JSON response', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ data: 42 }));

      const result = await post('/api/test', {}, { retries: 0 });
      expect(result).toEqual({ data: 42 });
    });
  });

  describe('get', () => {
    it('sends GET request', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ result: 'ok' }));

      const result = await get('/api/status', { retries: 0 });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.method).toBe('GET');
      expect(result).toEqual({ result: 'ok' });
    });

    it('includes auth headers', async () => {
      setAccessTokenGetter(async () => 'get-token');
      mockFetch.mockResolvedValue(jsonResponse({}));

      await get('/api/test', { retries: 0 });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers.Authorization).toBe('Bearer get-token');
    });

    it('parses JSON response', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ items: [1, 2, 3] }));

      const result = await get<{ items: number[] }>('/api/list', { retries: 0 });
      expect(result.items).toEqual([1, 2, 3]);
    });
  });

  describe('error handling', () => {
    it('throws ApiRequestError for non-ok response', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ error: 'Not found', code: 'NOT_FOUND' }, 404)
      );

      await expect(get('/api/missing', { retries: 0 })).rejects.toThrow(
        ApiRequestError
      );
    });

    it('includes status and code on ApiRequestError', async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ error: 'Not found', code: 'NOT_FOUND' }, 404)
      );

      try {
        await get('/api/missing', { retries: 0 });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiRequestError);
        expect((err as ApiRequestError).status).toBe(404);
        expect((err as ApiRequestError).code).toBe('NOT_FOUND');
      }
    });

    it('uses generic message for non-JSON error body', async () => {
      mockFetch.mockResolvedValue(
        new Response('Internal Server Error', { status: 500 })
      );

      try {
        await get('/api/broken', { retries: 0 });
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiRequestError);
        expect((err as ApiRequestError).message).toContain('500');
      }
    });
  });

  describe('retry', () => {
    it('retries on failure (default 2 retries = 3 attempts)', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValueOnce(jsonResponse({ ok: true }));

      const result = await get('/api/retry');
      expect(result).toEqual({ ok: true });
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('respects custom retry count', async () => {
      mockFetch.mockRejectedValue(new Error('always fails'));

      await expect(get('/api/fail', { retries: 1 })).rejects.toThrow(
        'always fails'
      );
      // 1 retry = 2 total attempts
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('stops on abort signal', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        get('/api/test', { signal: controller.signal, retries: 3 })
      ).rejects.toThrow();
    });
  });

  describe('timeout', () => {
    it('aborts after timeout period', async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new DOMException('aborted', 'AbortError')),
              50
            )
          )
      );

      await expect(
        get('/api/slow', { timeout: 1, retries: 0 })
      ).rejects.toThrow();
    });

    it('succeeds when response arrives before timeout', async () => {
      mockFetch.mockResolvedValue(jsonResponse({ fast: true }));

      const result = await get('/api/fast', { timeout: 5000, retries: 0 });
      expect(result).toEqual({ fast: true });
    });
  });

  describe('setAccessTokenGetter', () => {
    it('getter is called on each request', async () => {
      const getter = vi.fn().mockResolvedValue('dynamic-token');
      setAccessTokenGetter(getter);
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ a: 1 }))
        .mockResolvedValueOnce(jsonResponse({ b: 2 }));

      await get('/api/test', { retries: 0 });
      await get('/api/test', { retries: 0 });

      expect(getter).toHaveBeenCalledTimes(2);
    });
  });
});
