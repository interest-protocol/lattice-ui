import { z } from 'zod';

/** Validates a string containing a non-negative integer (e.g. raw token amounts). */
export const bigintString = z
  .string()
  .regex(/^\d+$/, 'Must be a non-negative integer');

/** Validates a byte array with configurable max length. */
export const byteArray = (maxLen: number) =>
  z.array(z.number().int().min(0).max(255)).max(maxLen);

/** Validates a byte array with no max length (for variable-length data like Sui coin types). */
export const byteArrayUnbounded = z.array(z.number().int().min(0).max(255));
