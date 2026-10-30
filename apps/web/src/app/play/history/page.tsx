'use client';

import { Badge, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/lib/store';

export default function HistoryPage() {
  const { state } = useStore();
  const { d, fill, num, pick, date } = useT();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.history.title}</h1>
      {state.matches.length === 0 ? (
        <Card>
          <p className="text-muted">{d.history.empty}</p>
        </Card>
      ) : (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {state.matches.map((m) => {
              const key = m.forfeit ? 'forfeit' : (m.outcome ?? 'draw');
              const tone = key === 'win' ? 'ok' : key === 'draw' ? 'brand' : 'bad';
              return (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <Badge tone={tone} className="w-16 justify-center">
                    {d.result[key]}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">
                      {m.opponent
                        ? fill(d.history.vs, { name: pick(m.opponent.name) })
                        : d.history.bot}
                    </div>
                    <div className="truncate text-xs text-muted">
                      {m.mode === 'ranked' ? d.match.ranked : d.match.practice} · {date(m.at, true)}
                    </div>
                  </div>
                  <div className="tabular text-end">
                    <div className="font-bold">
                      {num(m.myScore)} : {m.opponentScore === null ? '—' : num(m.opponentScore)}
                    </div>
                    {m.mode === 'ranked' && (
                      <div className="text-xs text-muted">
                        +{num(m.monthlyPoints, 1)} {d.common.pts}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
