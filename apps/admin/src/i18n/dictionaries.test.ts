import { expect, test, vi } from 'vitest';

vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined }) }));

const { DICTIONARIES, getLocale } = await import('./index');

function keys(node: unknown, prefix = ''): string[] {
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

test('ar and en have exactly the same keys', () => {
  expect(keys(DICTIONARIES.en).sort()).toEqual(keys(DICTIONARIES.ar).sort());
});

test('Arabic is the default locale', async () => {
  expect(await getLocale()).toBe('ar');
});
