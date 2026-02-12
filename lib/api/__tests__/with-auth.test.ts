import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

// --- Mocks ---

const mockAuthenticateRequest = vi.fn();
const mockVerifyUserMatch = vi.fn();

vi.mock('@/lib/api/auth', () => ({
  authenticateRequest: (req: unknown) => mockAuthenticateRequest(req),
  verifyUserMatch: (...args: unknown[]) => mockVerifyUserMatch(...args),
}));

const { withAuthPost, withAuthGet } = await import('../with-auth');

// --- Helpers ---

const AUTH_SUCCESS = { userId: 'user-123', accessToken: 'tok' };
const AUTH_401 = NextResponse.json(
  { error: 'Missing authorization token' },
  { status: 401 }
);

const makePostRequest = (body: unknown) =>
  new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeGetRequest = () =>
  new NextRequest('http://localhost/api/test', {
    method: 'GET',
    headers: { Authorization: 'Bearer test-token' },
  });

const schema = z.object({
  userId: z.string(),
  amount: z.string(),
});

// --- Tests ---

describe('withAuthGet', () => {
  it('returns 401 when auth fails', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_401);

    const handler = vi.fn();
    const route = withAuthGet(handler);
    const res = await route(makeGetRequest());

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes auth and request to handler on success', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const route = withAuthGet(handler);
    const req = makeGetRequest();
    const res = await route(req);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(AUTH_SUCCESS, req);
  });
});

describe('withAuthPost', () => {
  it('returns 401 when auth fails', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_401);

    const handler = vi.fn();
    const route = withAuthPost(schema, handler);
    const res = await route(makePostRequest({ userId: 'u', amount: '1' }));

    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 400 on malformed JSON', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);

    const handler = vi.fn();
    const route = withAuthPost(schema, handler);

    // Create a request with invalid JSON body
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json{{{',
    });

    const res = await route(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Invalid JSON body');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns 400 on schema validation failure', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);

    const handler = vi.fn();
    const route = withAuthPost(schema, handler);
    const res = await route(makePostRequest({ userId: 'u' })); // missing `amount`

    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes validated body, auth, and request to handler', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const route = withAuthPost(schema, handler);
    const req = makePostRequest({ userId: 'user-123', amount: '100' });
    const res = await route(req);

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      { userId: 'user-123', amount: '100' },
      AUTH_SUCCESS,
      expect.any(NextRequest)
    );
  });

  it('does NOT check userId when verifyUserId is omitted', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);
    mockVerifyUserMatch.mockReturnValue(null);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const route = withAuthPost(schema, handler);
    await route(makePostRequest({ userId: 'other-user', amount: '1' }));

    expect(mockVerifyUserMatch).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalled();
  });

  it('returns 403 on userId mismatch when verifyUserId is true', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);
    mockVerifyUserMatch.mockReturnValue(
      NextResponse.json({ error: 'User ID mismatch' }, { status: 403 })
    );

    const handler = vi.fn();
    const route = withAuthPost(schema, handler, { verifyUserId: true });
    const res = await route(
      makePostRequest({ userId: 'other-user', amount: '1' })
    );

    expect(res.status).toBe(403);
    expect(mockVerifyUserMatch).toHaveBeenCalledWith('user-123', 'other-user');
    expect(handler).not.toHaveBeenCalled();
  });

  it('passes through when verifyUserId is true and userId matches', async () => {
    mockAuthenticateRequest.mockResolvedValue(AUTH_SUCCESS);
    mockVerifyUserMatch.mockReturnValue(null);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const route = withAuthPost(schema, handler, { verifyUserId: true });
    const res = await route(
      makePostRequest({ userId: 'user-123', amount: '1' })
    );

    expect(res.status).toBe(200);
    expect(mockVerifyUserMatch).toHaveBeenCalledWith('user-123', 'user-123');
    expect(handler).toHaveBeenCalled();
  });
});
