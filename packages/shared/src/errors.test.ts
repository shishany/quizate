import { expect, test } from 'vitest';
import { ErrorCode, ERROR_HTTP_STATUS, errorBodySchema } from './errors.js';

test('every error code has an HTTP status', () => {
  for (const code of Object.values(ErrorCode)) {
    expect(ERROR_HTTP_STATUS[code], code).toBeTypeOf('number');
  }
});

test('error body rejects unknown codes', () => {
  expect(errorBodySchema.safeParse({ error: { code: 'NOPE', message: 'x' } }).success).toBe(false);
  expect(errorBodySchema.safeParse({ error: { code: 'NOT_FOUND', message: 'x' } }).success).toBe(
    true,
  );
});
