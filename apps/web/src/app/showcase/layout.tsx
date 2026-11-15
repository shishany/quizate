'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { ProductMark } from '@/components/ui';
import { DemoChip } from '@/components/showcase/ui';
import { ShowcaseProvider, useShowcase } from '@/lib/showcase/context';
import { useS } from '@/lib/showcase/i18n';
import { PHASES } from '@/lib/showcase/phases';
import { useStore } from '@/lib/store';

/** /showcase: a guided demonstration of Sabbaq on simulated data. Normal routes are not affected. */
export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return (
    <ShowcaseProvider>
      <Shell>{children}</Shell>
    </ShowcaseProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const { s, lang } = useS();
  const { phase, setPhase, setTourStep } = useShowcase();
  const { dispatch } = useStore();
  const path = usePathname();
  const nav = [
    { href: '/showcase', label: s.nav.home },
    { href: '/showcase/sponsor', label: s.nav.sponsor },
    { href: '/showcase/impact', label: s.nav.impact },
  ];
  return (
    <div className="min-h-screen bg-bg pb-10">
      <header className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-2">
          <ProductMark />
          <DemoChip />
          <button
            type="button"
            onClick={() => dispatch({ type: 'locale', locale: lang === 'ar' ? 'en' : 'ar' })}
            className="ms-auto rounded-full border border-line px-3 py-1 text-xs font-semibold"
          >
            {lang === 'ar' ? 'EN' : 'ع'}
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 pb-2">
          <div
            role="group"
            aria-label={s.phase}
            className="inline-flex rounded-full bg-bg p-0.5"
            data-tour="roadmap-control"
          >
            {PHASES.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={phase === p}
                onClick={() => setPhase(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${phase === p ? 'bg-primary text-white' : 'text-ink'}`}
              >
                {s.phases[p]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setTourStep(0)}
            className="ms-auto rounded-xl bg-action px-4 py-2 text-[19px] font-bold leading-tight text-white"
          >
            {s.startTour}
          </button>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 px-4 pb-2 text-sm">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={path === n.href ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 font-semibold ${path === n.href ? 'bg-primary/10 text-primary' : 'text-muted'}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 px-4 pt-4">{children}</main>
    </div>
  );
}
