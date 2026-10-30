import { PRODUCT, healthSchema, type Health } from '@quizate/shared';
import { DICTIONARIES, getLocale } from '@/i18n';

export const dynamic = 'force-dynamic';

async function fetchHealth(): Promise<Health | null> {
  try {
    const res = await fetch(`${process.env.API_URL ?? 'http://localhost:3001'}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    const parsed = healthSchema.safeParse(await res.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export default async function Home() {
  const locale = await getLocale();
  const t = DICTIONARIES[locale].home;
  const health = await fetchHealth();
  const overall = health ? t[health.status] : t.unreachable;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand">
            {locale === 'ar' ? PRODUCT.nameAr : PRODUCT.name}
          </p>
          <h1 className="text-2xl font-bold">{t.heading}</h1>
        </div>
        <a
          href={`/lang?to=${locale === 'ar' ? 'en' : 'ar'}`}
          className="rounded-full border border-slate-300 bg-white px-4 py-1.5 text-sm hover:bg-slate-50"
        >
          {DICTIONARIES[locale].lang.switchTo}
        </a>
      </header>

      <p className="mb-6 text-slate-600">{t.intro}</p>

      <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="status">
        <h2 id="status" className="mb-4 text-lg font-semibold">
          {t.apiStatus}:{' '}
          <span className={health?.status === 'ok' ? 'text-green-700' : 'text-red-700'}>
            {overall}
          </span>
        </h2>
        {health && (
          <ul className="grid gap-2 sm:grid-cols-3">
            {(['db', 'redis', 'storage'] as const).map((key) => {
              const check = health.checks[key];
              return (
                <li key={key} className="rounded-xl border border-slate-200 px-4 py-3">
                  <span className="block text-sm text-slate-500">{t[key]}</span>
                  <span className={check.status === 'up' ? 'text-green-700' : 'text-red-700'}>
                    {t[check.status]} · {check.latencyMs} {t.ms}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
