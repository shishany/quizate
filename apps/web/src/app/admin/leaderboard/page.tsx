'use client';

import { DAY_MS, HOUR_MS, monthFreezeAt } from '@quizate/game';
import { Badge, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { cityById } from '@/lib/sample';
import { useBoard } from '@/lib/standings';

/** FR-10, FR-11, BR-08, BR-10, BR-16, BR-17: the live month and its close schedule. */
export default function AdminLeaderboard() {
  const { d, num, pick, date } = useT();
  const { month, rows } = useBoard();
  const freeze = monthFreezeAt(new Date());
  const provisional = new Date(freeze.getTime() + 3 * DAY_MS);
  const appeals = new Date(provisional.getTime() + 48 * HOUR_MS);
  const steps = [
    [d.board.freeze, freeze],
    [d.board.provisional, provisional],
    [d.board.appeals, appeals],
    [d.board.final, appeals],
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.board.title}</h1>
      <Card title={`${d.board.close} · ${month}`}>
        <ol className="grid gap-2 sm:grid-cols-4">
          {steps.map(([label, at], i) => (
            <li key={i} className="rounded-xl bg-page p-3">
              <div className="text-xs text-muted">{num(i + 1)}</div>
              <div className="text-sm font-semibold">{label}</div>
              <div className="tabular text-xs text-muted">{date(at.toISOString(), true)}</div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">{d.board.reviewTop}</p>
      </Card>

      <Card className="overflow-x-auto p-0 sm:p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-page text-start text-xs text-muted">
            <tr>
              {[
                d.lb.rank,
                d.lb.player,
                d.lb.points,
                d.lb.matches,
                d.board.opponents,
                d.lb.accuracy,
                d.lb.avgTime,
                d.board.prizeRank,
              ].map((h) => (
                <th key={h} className="px-3 py-2 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.playerId} className={r.me ? 'bg-brand/5' : ''}>
                <td className="tabular px-3 py-2">{num(r.rank)}</td>
                <td className="px-3 py-2">
                  <span className="font-medium">{pick(r.name)}</span>{' '}
                  <span className="text-xs text-muted">{pick(cityById(r.cityId).name)}</span>
                </td>
                <td className="tabular px-3 py-2 font-semibold">{num(r.points, 1)}</td>
                <td className="tabular px-3 py-2">
                  {num(r.counted)} / {num(r.played)}
                </td>
                <td className="tabular px-3 py-2">{num(r.distinctOpponents)}</td>
                <td className="tabular px-3 py-2">{num(Math.round(r.accuracy * 100))}%</td>
                <td className="tabular px-3 py-2">
                  {Number.isFinite(r.avgLatencyMs)
                    ? `${num(r.avgLatencyMs / 1000, 1)} ${d.common.sec}`
                    : '—'}
                </td>
                <td className="px-3 py-2">
                  {r.prizeRank ? (
                    <Badge tone="gold">#{num(r.prizeRank)}</Badge>
                  ) : (
                    <span className="text-xs text-muted">{d.board.notEligible}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted">{d.lb.tieBreak}</p>
    </div>
  );
}
