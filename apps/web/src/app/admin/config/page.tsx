'use client';

import { useState } from 'react';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { adminName } from '@/lib/sample';
import { readConfig, useStore, type ConfigKey } from '@/lib/store';

const KEYS: { key: ConfigKey; rule: string; step: number; min: number; max: number }[] = [
  { key: 'pointsPerCorrect', rule: 'BR-01', step: 1, min: 1, max: 100 },
  { key: 'questionSeconds', rule: 'FR-06', step: 1, min: 5, max: 60 },
  { key: 'monthlyShare.win', rule: 'BR-04', step: 0.05, min: 0, max: 1 },
  { key: 'monthlyShare.loss', rule: 'BR-04', step: 0.05, min: 0, max: 1 },
  { key: 'monthlyShare.draw', rule: 'BR-04', step: 0.05, min: 0, max: 1 },
  { key: 'monthlyCap', rule: 'BR-05', step: 1, min: 1, max: 500 },
  { key: 'dailyRankedLimit', rule: 'BR-06', step: 1, min: 1, max: 100 },
  { key: 'samePair.per24h', rule: 'BR-07', step: 1, min: 1, max: 10 },
  { key: 'samePair.perMonth', rule: 'BR-07', step: 1, min: 1, max: 31 },
  { key: 'eligibility.minMatches', rule: 'BR-08', step: 1, min: 1, max: 200 },
  { key: 'eligibility.minOpponents', rule: 'BR-08', step: 1, min: 1, max: 100 },
  { key: 'rating.k', rule: 'BR-09', step: 1, min: 1, max: 64 },
  { key: 'abandon.graceSeconds', rule: 'BR-11', step: 1, min: 5, max: 120 },
  { key: 'abandon.blockAfter', rule: 'BR-12', step: 1, min: 1, max: 20 },
  { key: 'questionRepeatDays', rule: 'BR-13', step: 1, min: 0, max: 365 },
  { key: 'maxSponsored', rule: 'BR-14', step: 1, min: 0, max: 10 },
  { key: 'fairPlay.minHumanMs', rule: '§3', step: 50, min: 100, max: 3000 },
  { key: 'speedRound.seconds', rule: '—', step: 5, min: 15, max: 300 },
];

/** FR-27: every BRD default is configuration; a change needs a reason and is logged. */
export default function ConfigPage() {
  const { state } = useStore();
  const { d, num, date, locale } = useT();
  const superAdmin = state.adminRole === 'super_admin';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.config.title}</h1>
      <p className="text-muted">{d.config.intro}</p>
      {!superAdmin && <Notice tone="warn">{d.config.superOnly}</Notice>}

      <Card title={d.config.flags}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="text-sm" dir="ltr">
            {d.config.prizesFlag}
          </code>
          <Badge tone="bad">{d.config.prizesOff}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted">{d.config.prizesLocked}</p>
      </Card>

      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-line">
          {KEYS.map((k) => (
            <Row key={k.key} item={k} editable={superAdmin} />
          ))}
        </ul>
      </Card>

      <Card title={d.config.history}>
        {state.configHistory.length === 0 ? (
          <p className="text-sm text-muted">{d.audit.empty}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {state.configHistory.map((c, i) => (
              <li key={i} className="rounded-xl bg-page px-3 py-2">
                <div className="font-medium">
                  {d.config.keys[c.key as ConfigKey]}:{' '}
                  <span className="tabular">
                    {num(Number(c.from), 2)} → {num(Number(c.to), 2)}
                  </span>
                </div>
                <div className="text-xs text-muted">
                  {c.reason} · {adminName(c.actor, locale)} · {date(c.at, true)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Row({ item, editable }: { item: (typeof KEYS)[number]; editable: boolean }) {
  const { key, rule, step, min, max } = item;
  const { state, dispatch } = useStore();
  const { d, num } = useT();
  const current = readConfig(state.config, key);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(current));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function save() {
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) return setError(`${min} – ${max}`);
    if (!reason.trim()) return setError(d.config.reasonRequired);
    dispatch({ type: 'config', key, value: n, reason: reason.trim() });
    setEditing(false);
    setReason('');
    setError('');
  }

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-medium">{d.config.keys[key]}</div>
          <div className="text-xs text-muted" dir="ltr">
            {key} · {rule}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="tabular text-lg font-bold">{num(current, 2)}</span>
          {editable && !editing && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setValue(String(current));
                setEditing(true);
              }}
            >
              {d.config.change}
            </Button>
          )}
        </div>
      </div>
      {editing && (
        <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr_auto_auto]">
          <input
            type="number"
            className="tabular rounded-xl border border-line px-3 py-2 text-sm"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => setValue(e.target.value)}
            aria-label={d.config.value}
          />
          <input
            className="rounded-xl border border-line px-3 py-2 text-sm"
            placeholder={d.config.reason}
            aria-label={d.config.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button size="sm" onClick={save}>
            {d.common.save}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
            {d.common.cancel}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-bad sm:col-span-4">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
