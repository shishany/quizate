'use client';

import { useState } from 'react';
import { Badge, Card, Notice, Tabs } from '@/components/ui';
import { useT } from '@/i18n';
import { cityById } from '@/lib/sample';
import { useBoard, type BoardRow } from '@/lib/standings';
import { useStore } from '@/lib/store';

/** FR-10: monthly, all-time and following views; my position and the gap to the top 10. */
export default function LeaderboardPage() {
  const { state } = useStore();
  const { d, fill, num, pick } = useT();
  const { rows, me } = useBoard();
  const [tab, setTab] = useState<'monthly' | 'allTime' | 'friends'>('monthly');

  const list: BoardRow[] =
    tab === 'monthly'
      ? rows
      : tab === 'allTime'
        ? [...rows].sort((a, b) => b.allTime - a.allTime).map((r, i) => ({ ...r, rank: i + 1 }))
        : rows.filter((r) => r.me || state.following.includes(r.playerId));

  const tenth = rows[9];
  const gap = me && tenth && me.rank > 10 ? Math.max(0, tenth.points - me.points) + 0.5 : 0;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.lb.title}</h1>
      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'monthly', label: d.lb.monthly },
          { id: 'allTime', label: d.lb.allTime },
          { id: 'friends', label: d.lb.friends },
        ]}
      />

      {tab === 'monthly' && me && me.counted > 0 && (
        <Notice tone={me.rank <= 10 ? 'gold' : 'brand'}>
          {me.rank <= 10 ? d.lb.inTop10 : fill(d.lb.gap, { pts: num(gap, 1) })}
        </Notice>
      )}
      {tab === 'friends' && list.length <= 1 && <Notice>{d.lb.friendsEmpty}</Notice>}

      <Card className="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {list.map((r) => (
            <li
              key={r.playerId}
              className={`flex items-center gap-3 px-4 py-3 ${r.me ? 'bg-brand/5' : ''}`}
            >
              <span
                className={`tabular grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold ${r.rank <= 3 ? 'bg-gold/20 text-gold-ink' : 'bg-slate-100 text-muted'}`}
              >
                {num(r.rank)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{pick(r.name)}</span>
                  {r.me && <Badge tone="brand">{d.lb.you}</Badge>}
                  {tab === 'monthly' && r.eligible && <Badge tone="ok">{d.lb.eligible}</Badge>}
                </div>
                <div className="tabular truncate text-xs text-muted">
                  {pick(cityById(r.cityId).name)}
                  {tab !== 'allTime' &&
                    ` · ${d.lb.matches} ${num(r.counted)} · ${d.lb.accuracy} ${num(Math.round(r.accuracy * 100))}%`}
                </div>
              </div>
              <span className="tabular text-end font-bold">
                {num(tab === 'allTime' ? r.allTime : r.points, 1)}
                <span className="ms-1 text-xs font-normal text-muted">{d.common.pts}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
      <p className="text-xs text-muted">{d.lb.tieBreak}</p>
      <p className="text-xs text-muted">{d.lb.sampleNote}</p>
    </div>
  );
}
