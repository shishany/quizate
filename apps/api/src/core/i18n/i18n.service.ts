import { Injectable } from '@nestjs/common';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@quizate/shared';
import { ar } from '../../i18n/ar.js';
import { en } from '../../i18n/en.js';

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ar>;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type MessageKey = Leaves<Dictionary>;

export const DICTIONARIES: Record<Locale, Dictionary> = { ar, en };

/**
 * Picks the locale from `?lang=`, then the first supported Accept-Language entry, else Arabic.
 * Quality values are ignored on purpose: clients send at most a short, ordered list.
 */
export function resolveLocale(query: unknown, acceptLanguage: string | undefined): Locale {
  if (isLocale(query)) return query;
  for (const part of (acceptLanguage ?? '').split(',')) {
    const tag = part.split(';')[0]?.trim().toLowerCase().split('-')[0];
    if (isLocale(tag)) return tag;
  }
  return DEFAULT_LOCALE;
}

@Injectable()
export class I18nService {
  t(locale: Locale, key: MessageKey, vars: Record<string, string | number> = {}): string {
    const text = key
      .split('.')
      .reduce<unknown>(
        (node, part) => (node as Record<string, unknown> | undefined)?.[part],
        DICTIONARIES[locale],
      );
    if (typeof text !== 'string') return key;
    return text.replace(/\{(\w+)\}/g, (m, name: string) => String(vars[name] ?? m));
  }
}
