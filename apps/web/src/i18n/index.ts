'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { Locale } from '@/lib/types';
import { ar } from './ar';
import { en } from './en';

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { [K in keyof T]: Widen<T[K]> };
export type Dictionary = Widen<typeof ar>;

export const DICTIONARIES: Record<Locale, Dictionary> = { ar, en };

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
      n.toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', {
        maximumFractionDigits: digits,
      }),
    [locale],
  );
  const date = useCallback(
    (iso: string, withTime = false) =>
      new Date(iso).toLocaleString(locale === 'ar' ? 'ar-SA-u-nu-latn-ca-gregory' : 'en-GB', {
        timeZone: 'Asia/Riyadh',
        day: 'numeric',
        month: 'short',
        year: withTime ? undefined : 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      }),
    [locale],
  );
  const pick = useCallback((text: { ar: string; en: string }) => text[locale], [locale]);
  return { d, locale, fill, num, date, pick };
}
