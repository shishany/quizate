'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { Locale } from '@/lib/types';
import { ar } from './ar';
import { en } from './en';
import { ur } from './ur';

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof ar>;

export const DICTIONARIES: Record<Locale, Dictionary> = { ar, en, ur };

/** Each language's own name, as shown in the language switcher. */
export const LANGUAGE_NAMES: Record<Locale, string> = { ar: 'العربية', en: 'English', ur: 'اردو' };

const NUMBER_LOCALE: Record<Locale, string> = {
  ar: 'ar-SA-u-nu-latn',
  en: 'en-US',
  ur: 'ur-PK-u-nu-latn',
};
const DATE_LOCALE: Record<Locale, string> = {
  ar: 'ar-SA-u-nu-latn-ca-gregory',
  en: 'en-GB',
  ur: 'ur-PK-u-nu-latn',
};

/** Text in the viewer's language. Urdu falls back to Arabic until a native reviewer approves the Urdu (FR-29). */
export function pickText(text: { ar: string; en: string; ur?: string }, locale: Locale): string {
  return locale === 'ur' ? (text.ur ?? text.ar) : text[locale];
}

/** Fills `{name}` placeholders. */
export function fill(text: string, vars: Record<string, string | number> = {}): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function useT() {
  const { state } = useStore();
  const locale = state.locale;
  const d = DICTIONARIES[locale];
  const num = useCallback(
    (n: number, digits = 0) =>
      n.toLocaleString(NUMBER_LOCALE[locale], {
        maximumFractionDigits: digits,
      }),
    [locale],
  );
  const date = useCallback(
    (iso: string, withTime = false) =>
      new Date(iso).toLocaleString(DATE_LOCALE[locale], {
        timeZone: 'Asia/Riyadh',
        day: 'numeric',
        month: 'short',
        year: withTime ? undefined : 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      }),
    [locale],
  );
  const pick = useCallback(
    (text: { ar: string; en: string; ur?: string }) => pickText(text, locale),
    [locale],
  );
  return { d, locale, fill, num, date, pick };
}
