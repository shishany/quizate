'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { AdminSignIn } from '@/components/admin/AdminSignIn';
import { ACCESS, PAGES, pageForPath } from '@/components/admin/access';
import { Button, LangToggle, Loading, Notice, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { productName } from '@/lib/product';
import { ADMIN_USERS } from '@/lib/sample';
import { useStore } from '@/lib/store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { state, dispatch, ready } = useStore();
  const { d, locale, pick } = useT();
  const pathname = usePathname();

  if (!ready) return <Loading />;
  if (!state.adminRole) return <AdminSignIn />;

  const role = state.adminRole;
  const visible = PAGES.filter((p) => ACCESS[p.id].includes(role));
  const current = pageForPath(pathname);
  const allowed = ACCESS[current].includes(role);

  const nav = visible.map((p) => {
    const active = p.id === current;
    return (
      <Link
        key={p.id}
        href={p.href}
        aria-current={active ? 'page' : undefined}
        className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium ${active ? 'bg-brand-gradient text-white' : 'text-ink hover:bg-slate-100'}`}
      >
        {d.admin.nav[p.id]}
      </Link>
    );
  });

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-e border-line bg-white p-4 lg:flex lg:flex-col">
        <Link href="/" className="mb-5 flex items-center gap-2.5">
          <ProductMark />
          <span className="font-bold">{productName(locale)}</span>
        </Link>
        <nav className="flex flex-col gap-1" aria-label={d.common.adminPortal}>
          {nav}
        </nav>
        <div className="mt-auto rounded-xl bg-page p-3 text-sm">
          <div className="text-xs text-muted">{d.admin.signedInAs}</div>
          <div className="font-semibold">{pick(ADMIN_USERS[role].name)}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 px-0"
            onClick={() => dispatch({ type: 'adminSignOut' })}
          >
            {d.admin.switchRole}
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <span className="lg:hidden">
              <ProductMark />
            </span>
            <span className="hidden truncate font-semibold sm:inline">{d.common.adminPortal}</span>
            <SampleChip />
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted sm:inline">{d.admin.roles[role]}</span>
            <LangToggle />
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap lg:hidden"
              onClick={() => dispatch({ type: 'adminSignOut' })}
            >
              {d.admin.switchRole}
            </Button>
          </div>
        </header>
        <nav
          className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 lg:hidden"
          aria-label={d.common.adminPortal}
        >
          {nav}
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-6">
          {allowed ? children : <Notice tone="warn">{d.admin.noAccess}</Notice>}
        </main>
      </div>
    </div>
  );
}
