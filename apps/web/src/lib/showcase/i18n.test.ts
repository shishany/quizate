import { describe, expect, it } from 'vitest';
import { SHOWCASE_STRINGS } from './i18n';

const keys = (o: object, p = ''): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? keys(v, `${p}${k}.`) : [`${p}${k}`],
  );

describe('showcase strings', () => {
  it('Arabic and English have the same keys', () => {
    expect(keys(SHOWCASE_STRINGS.en).sort()).toEqual(keys(SHOWCASE_STRINGS.ar).sort());
  });
});
