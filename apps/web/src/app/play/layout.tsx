'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { SignIn } from '@/components/player/SignIn';
import { LangToggle, Loading, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { live } from '@/lib/live';
import { productName } from '@/lib/product';
import { useStore } from '@/lib/store';

const NAV = [
  { href: '/play', key: 'home', icon: '⌂' },
  { href: '/play/ladder', key: 'ladder', icon: '⬆' },
  { href: '/play/leaderboard', key: 'leaderboard', icon: '▤' },
  { href: '/play/history', key: 'history', icon: '◷' },
  { href: '/play/profile', key: 'profile', icon: '◉' },
] as const;

const FOCUS_ROUTES = ['/play/ranked', '/play/practice', '/play/speed', '/play/mirror'];

export default function PlayerLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, ready } = useStore();
  const { d, locale } = useT();
  const pathname = usePathname();
  const focus = FOCUS_ROUTES.includes(pathname);

  // A ranked match that is not running on this page any more was abandoned: settle it as a forfeit (BR-11, BR-12).
  useEffect(() => {
    if (ready && state.activeRanked && state.activeRanked.id !== live.matchId)
      dispatch({ type: 'rankedForfeitStale' });
  }, [ready, state.activeRanked, pathname, dispatch]);

  if (!ready) return <Loading />;
  if (!state.player) return <SignIn />;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line/70 bg-white/90 px-4 py-3 backdrop-blur">
        <Link href="/play" className="flex items-center gap-2.5">
          <ProductMark />
          <span className="font-bold">{productName(locale)}</span>
        </Link>
        <div className="flex items-center gap-2">
          <SampleChip />
          {!focus && <LangToggle />}
        </div>
      </header>

      <main className={`flex-1 px-4 py-5 ${focus ? '' : 'pb-24'}`}>{children}</main>

      {!focus && (
        <nav
          aria-label={d.nav.home}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 backdrop-blur"
        >
          <ul className="mx-auto grid max-w-2xl grid-cols-5">
            {NAV.map((item) => {
              const active =
                item.href === '/play' ? pathname === '/play' : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${active ? 'text-brand' : 'text-muted hover:text-ink'}`}
                  >
                    <span aria-hidden className="text-lg leading-none">
                      {item.icon}
                    </span>
                    {d.nav[item.key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}
