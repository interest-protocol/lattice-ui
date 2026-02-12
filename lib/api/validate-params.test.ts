import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorResponse, validateBody, validateQueryParam } from './validate-params';

describe('validate-params', () => {
  describe('validateBody', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('returns data for valid input', () => {
      const result = validateBody({ name: 'Alice', age: 30 }, schema);
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
      expect(result.error).toBeUndefined();
    });

    it('returns 400 error for invalid input', async () => {
      const result = validateBody({ name: 'Alice' }, schema);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error!.status).toBe(400);
    });

    it('includes field name in error message', async () => {
      const result = validateBody({}, schema);
      const body = await result.error!.json();
      expect(body.error).toContain('name');
    });

    it('handles nested schema', () => {
      const nestedSchema = z.object({
        user: z.object({ email: z.string().email() }),
      });
      const result = validateBody(
        { user: { email: 'not-email' } },
        nestedSchema
      );
      expect(result.error).toBeDefined();
    });

    it('returns parsed data (strips unknown fields)', () => {
      const result = validateBody(
        { name: 'Alice', age: 30, extra: 'field' },
        schema
      );
      expect(result.data).toEqual({ name: 'Alice', age: 30 });
    });
  });

  describe('validateQueryParam', () => {
    it('returns null for non-empty string', () => {
      expect(validateQueryParam('value', 'param')).toBeNull();
    });

    it('returns 400 for null', async () => {
      const result = validateQueryParam(null, 'userId');
      expect(result).not.toBeNull();
      expect(result!.status).toBe(400);
      const body = await result!.json();
      expect(body.error).toContain('userId');
    });

    it('returns 400 for empty string', async () => {
      const result = validateQueryParam('', 'token');
      expect(result).not.toBeNull();
      expect(result!.status).toBe(400);
      const body = await result!.json();
      expect(body.error).toContain('token');
    });
  });

  describe('errorResponse', () => {
    it('returns correct status and message from Error', async () => {
      const res = errorResponse(new Error('Something failed'), 'Fallback', 422);
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toBe('Something failed');
    });

    it('uses fallback when not Error', async () => {
      const res = errorResponse(42, 'Fallback message');
      const body = await res.json();
      expect(body.error).toBe('Fallback message');
    });

    it('defaults to status 500', () => {
      const res = errorResponse(new Error('fail'), 'fallback');
      expect(res.status).toBe(500);
    });
  });
});
