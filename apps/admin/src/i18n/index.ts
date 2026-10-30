import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@quizate/shared';
import { ar } from './ar';
import { en } from './en';

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
export type Dictionary = Widen<typeof ar>;

export const DICTIONARIES: Record<Locale, Dictionary> = { ar, en };
export const LOCALE_COOKIE = 'lang';

/** The viewer's locale from the `lang` cookie; Arabic when unset. */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
