import { expect, test } from 'vitest';
import { DEFAULT_LOCALE, dirOf, isLocale } from './locale.js';

test('Arabic is the default locale and reads right to left', () => {
  expect(DEFAULT_LOCALE).toBe('ar');
  expect(dirOf('ar')).toBe('rtl');
  expect(dirOf('en')).toBe('ltr');
  expect(isLocale('fr')).toBe(false);
});
