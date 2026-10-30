import { expect, test } from 'vitest';
import { ar } from './ar';
import { en } from './en';
import { ur } from './ur';

function keys(node: unknown, prefix = ''): string[] {
  if (Array.isArray(node)) return [`${prefix}[${node.length}]`];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

test('ar, en and ur have exactly the same keys (and list lengths)', () => {
  expect(keys(en).sort()).toEqual(keys(ar).sort());
  expect(keys(ur).sort()).toEqual(keys(ar).sort());
});

test('placeholders match between languages', () => {
  const holders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
  const walk = (a: unknown, b: unknown, path: string) => {
    if (typeof a === 'string') return expect(holders(b as string), path).toBe(holders(a));
    for (const k of Object.keys(a as object))
      walk((a as never)[k], (b as never)[k], `${path}.${k}`);
  };
  walk(ar, en, '');
  walk(ar, ur, '');
});

test('the UI never claims to be a demo or a test, and never promises cash', () => {
  const text = JSON.stringify(en).toLowerCase();
  expect(text).not.toMatch(/\bdemo\b|\btest\b/);
  expect(text).not.toMatch(/win sar|guaranteed/);
});
