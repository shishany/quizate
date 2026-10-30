'use client';

import { Badge, Card, Stat } from '@/components/ui';
import { useT } from '@/i18n';
import { useBoard } from '@/lib/standings';
import { useStore } from '@/lib/store';

/** Sample beta figures, labelled as such; targets are the BRD section 7 KPIs. */
const KPIS = [
  { key: 'kpiCompleted', value: '91%', target: '≥ 85%' },
  { key: 'kpiWait', value: '14 s', target: '< 30 s' },
  { key: 'kpiD7', value: '26%', target: '≥ 20%' },
  { key: 'kpiPerWeek', value: '6.2', target: '≥ 5' },
  { key: 'kpiFraud', value: '0.6%', target: '< 1%' },
  { key: 'kpiSponsors', value: '2', target: '≥ 2' },
] as const;

export default function Overview() {
  const { state } = useStore();
  const { d, fill, num } = useT();
  const { rows } = useBoard();
  const active = rows.filter((r) => r.played > 0);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">{d.overview.title}</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label={d.overview.players} value={num(active.length)} />
        <Stat label={d.overview.eligible} value={num(rows.filter((r) => r.eligible).length)} />
        <Stat label={d.overview.matches} value={num(rows.reduce((s, r) => s + r.played, 0))} />
        <Stat
          label={d.overview.published}
          value={num(state.questions.filter((q) => q.status === 'published').length)}
        />
        <Stat
          label={d.overview.inReview}
          value={num(state.questions.filter((q) => q.status === 'in_review').length)}
        />
        <Stat
          label={d.overview.openFlags}
          value={num(
            state.fraud.filter((f) => f.status === 'open' || f.status === 'investigating').length,
          )}
        />
      </div>
      <Card title={d.overview.kpis} action={<Badge tone="violet">{d.common.sample}</Badge>}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {KPIS.map((k) => (
            <Stat
              key={k.key}
              label={d.overview[k.key]}
              value={k.value}
              hint={fill(d.overview.target, { v: k.target })}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{d.overview.sampleKpi}</p>
      </Card>
    </div>
  );
}
