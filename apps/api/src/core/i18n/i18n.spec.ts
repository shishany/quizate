import { DICTIONARIES, I18nService, resolveLocale } from './i18n.service.js';

function keys(node: unknown, prefix = ''): string[] {
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : keys(v, `${prefix}${k}.`),
  );
}

describe('i18n', () => {
  it('ar and en have exactly the same keys', () => {
    expect(keys(DICTIONARIES.en).sort()).toEqual(keys(DICTIONARIES.ar).sort());
  });

  it('defaults to Arabic', () => {
    expect(resolveLocale(undefined, undefined)).toBe('ar');
    expect(resolveLocale('fr', 'de-DE,fr;q=0.8')).toBe('ar');
  });

  it('prefers ?lang over Accept-Language', () => {
    expect(resolveLocale('en', 'ar-SA')).toBe('en');
    expect(resolveLocale(undefined, 'en-GB,ar;q=0.5')).toBe('en');
  });

  it('translates by key', () => {
    const i18n = new I18nService();
    expect(i18n.t('en', 'errors.NOT_FOUND')).toBe('Not found.');
    expect(i18n.t('ar', 'errors.NOT_FOUND')).toBe('لم يتم العثور على المطلوب.');
  });
});
