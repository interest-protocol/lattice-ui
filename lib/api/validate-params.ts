import { NextResponse } from 'next/server';
import type { ZodSchema } from 'zod';

export const validateBody = <T>(
  body: unknown,
  schema: ZodSchema<T>
): { data: T; error?: never } | { data?: never; error: NextResponse } => {
  const result = schema.safeParse(body);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const field = firstIssue.path.join('.');
    const message = field ? `Missing ${field}` : firstIssue.message;
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { data: result.data };
};

export const validateQueryParam = (
  value: string | null,
  label: string
): NextResponse | null => {
  if (!value) {
    return NextResponse.json({ error: `Missing ${label}` }, { status: 400 });
  }
  return null;
};
