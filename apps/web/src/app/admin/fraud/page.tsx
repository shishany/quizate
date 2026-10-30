'use client';

import { useState } from 'react';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { adminName, samplePlayerById } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { FraudFlag, FraudStatus } from '@/lib/types';

const STATUS_TONE: Record<FraudStatus, 'neutral' | 'ok' | 'bad' | 'warn' | 'brand'> = {
  open: 'warn',
  investigating: 'brand',
  cleared: 'ok',
  warned: 'warn',
  suspended: 'bad',
};

/** FR-26: flags with evidence; an analyst decides with a recorded reason. */
export default function FraudPage() {
  const { state } = useStore();
  const { d } = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.fraud.title}</h1>
      <Notice>{d.fraud.noAutoBan}</Notice>
      <div className="grid gap-3">
        {state.fraud.map((f) => (
          <FlagCard key={f.id} f={f} />
        ))}
      </div>
    </div>
  );
}

function FlagCard({ f }: { f: FraudFlag }) {
  const { state, dispatch } = useStore();
  const { d, num, pick, date, locale } = useT();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const names = f.playerIds.map((id) =>
    id === 'me'
      ? (state.player?.name ?? id)
      : pick(samplePlayerById(id)?.name ?? { ar: id, en: id }),
  );
  const decided = ['cleared', 'warned', 'suspended'].includes(f.status);

  function decide(status: FraudStatus) {
    if (!reason.trim()) return setError(d.fraud.reasonRequired);
    dispatch({ type: 'fraud', id: f.id, status, reason });
    setReason('');
    setError('');
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-bold">{d.fraud.signals[f.signal]}</div>
          <div className="text-sm text-muted">
            {names.join(' · ')} · {date(f.at, true)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={f.risk >= 60 ? 'bad' : 'warn'}>
            {d.fraud.risk} {num(f.risk)}
          </Badge>
          <Badge tone={STATUS_TONE[f.status]}>{d.fraud.statuses[f.status]}</Badge>
        </div>
      </div>
      <p className="mt-2 text-sm">
        <span className="text-muted">{d.fraud.evidence}: </span>
        {pick(f.evidence)}
      </p>
      {f.decision && (
        <p className="mt-2 text-sm text-muted">
          {d.fraud.decision}: {f.decision.reason} — {adminName(f.decision.actor, locale)}
        </p>
      )}
      {!decided && (
        <div className="mt-3 space-y-2">
          <input
            className="w-full rounded-xl border border-line px-3 py-2 text-sm"
            placeholder={d.questions.reason}
            aria-label={d.questions.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-bad">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {f.status === 'open' && (
              <Button size="sm" variant="secondary" onClick={() => decide('investigating')}>
                {d.fraud.statuses.investigating}
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={() => decide('cleared')}>
              {d.fraud.statuses.cleared}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => decide('warned')}>
              {d.fraud.statuses.warned}
            </Button>
            <Button size="sm" variant="danger" onClick={() => decide('suspended')}>
              {d.fraud.statuses.suspended}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
