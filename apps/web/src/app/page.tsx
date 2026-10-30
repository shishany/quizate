'use client';

import Link from 'next/link';
import { LangToggle, Loading, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { productName } from '@/lib/product';
import { useStore } from '@/lib/store';

export default function Landing() {
  const { ready } = useStore();
  const { d, locale } = useT();
  if (!ready) return <Loading />;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <ProductMark />
          <span className="text-lg font-bold">{productName(locale)}</span>
          <SampleChip />
        </div>
        <LangToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12">
        <section className="bg-brand-gradient mt-2 rounded-3xl px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="mb-2 text-sm font-semibold text-sky-200">{d.landing.title}</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            {d.common.tagline}
          </h1>
          <p className="mt-4 max-w-2xl text-white/85">{d.landing.intro}</p>
        </section>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <PortalCard
            href="/play"
            title={d.landing.playerTitle}
            body={d.landing.playerBody}
            cta={d.landing.playerCta}
            accent="brand"
          />
          <PortalCard
            href="/admin"
            title={d.landing.adminTitle}
            body={d.landing.adminBody}
            cta={d.landing.adminCta}
            accent="gold"
          />
        </div>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-4 pb-6 text-xs text-muted">
        {d.common.footer}
      </footer>
    </div>
  );
}

function PortalCard({
  href,
  title,
  body,
  cta,
  accent,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
  accent: 'brand' | 'gold';
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-white p-6 shadow-[0_1px_3px_rgba(11,34,56,0.06)] transition-shadow hover:shadow-md"
    >
      <span
        className={`mb-4 h-1.5 w-12 rounded-full ${accent === 'brand' ? 'bg-brand' : 'bg-gold'}`}
        aria-hidden
      />
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 flex-1 text-muted">{body}</p>
      <span className="mt-5 inline-flex items-center gap-1 font-semibold text-brand">
        {cta}{' '}
        <span className="rtl:rotate-180" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
