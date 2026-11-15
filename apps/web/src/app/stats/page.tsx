'use client';

import Link from 'next/link';
import { riyadhDayKey } from '@quizate/game';
import { Badge, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { productName } from '@/lib/product';
import { SAMPLE_PLAYERS, sampleMonthResults } from '@/lib/sample';
import { useBoard } from '@/lib/standings';
import { useStore } from '@/lib/store';

/** CR v3 section 8: public, read-only live stats: registered players, matches today, top 5. No personal data. */
export default function StatsPage() {
  const { state } = useStore();
  const { d, num, pick, locale } = useT();
  const now = new Date();
  const today = riyadhDayKey(now);
  const { rows } = useBoard(now);
  const sample = sampleMonthResults(now, state.config);
  const sampleToday = [...sample.values()].flat().filter((r) => riyadhDayKey(r.at) === today).length;
  const mineToday = state.matches.filter((m) => riyadhDayKey(m.at) === today).length;
  const players = SAMPLE_PLAYERS.length + (state.player ? 1 : 0);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-primary">{productName(locale)}</p>
          <h1 className="text-2xl font-bold">{d.stats.title}</h1>
        </div>
        <Badge tone="violet">{d.common.sample}</Badge>
      </header>
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-muted">{d.stats.players}</div>
          <div className="tabular text-3xl font-bold">{num(players)}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">{d.stats.matchesToday}</div>
          <div className="tabular text-3xl font-bold">{num(sampleToday + mineToday)}</div>
        </Card>
      </div>
      <Card title={d.stats.top5} className="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {rows.slice(0, 5).map((r) => (
            <li key={r.playerId} className="flex items-center gap-3 px-4 py-3">
              <span className="tabular grid h-8 w-8 place-items-center rounded-full bg-highlight/30 text-sm font-bold">
                {num(r.rank)}
              </span>
              <span className="flex-1 truncate font-semibold">{pick(r.name)}</span>
              <span className="tabular font-bold">{num(r.rating)}</span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="text-xs text-muted">{d.stats.note}</p>
      <Link href="/" className="text-sm font-semibold text-primary">
        {d.common.back}
      </Link>
    </main>
  );
}
