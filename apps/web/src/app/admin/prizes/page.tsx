'use client';

import { useState } from 'react';
import {
  canMovePayout,
  halalasToSar,
  monthlyPoolHalalas,
  prizePoolHalalas,
  scaledPrizeTable,
  type PayoutStatus,
} from '@quizate/game';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { sampleCampaigns } from '@/data/sponsors';
import { useBoard, type BoardRow } from '@/lib/standings';
import { useStore } from '@/lib/store';
import { fundingForMonth } from '@/lib/sponsorship';
import type { PayoutRecord } from '@/lib/types';

const TONE: Record<PayoutStatus, 'warn' | 'brand' | 'ok' | 'bad'> = {
  pending_review: 'warn',
  approved: 'brand',
  paid: 'ok',
  rejected: 'bad',
};

/**
 * CR v3 section 9: prize pool from sponsor funding, scaled table, payout queue with manual review, youth in-kind
 * awards and the action log. Cash payouts stay behind `prizes.enabled` and a legal approval (architecture rule 5):
 * in the sample version nothing is paid.
 */
export default function PrizesPage() {
  const { state } = useStore();
  const { d, num, fill, pick, date } = useT();
  const now = new Date();
  const { month, rows } = useBoard(now);
  const table = state.config.prizeTableHalalas;
  const funding = fundingForMonth(sampleCampaigns(now), state.sponsorEvents, month, now);
  const pool = monthlyPoolHalalas(table, funding);
  const scaled = scaledPrizeTable(table, pool);
  const winners = rows.filter((r) => r.prizeZone !== null);
  const youth = rows.filter((r) => r.youthTop !== null);
  const log = state.audit.filter((a) => a.action.startsWith('payout.') || a.action.startsWith('youth_award.'));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{d.prizes.title}</h1>
        <Badge tone="violet">{d.common.sample}</Badge>
      </div>
      <Notice tone="gold">{d.prizes.locked}</Notice>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title={fill(d.prizes.poolTitle, { month })}>
          <dl className="tabular space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt>{d.prizes.funding}</dt>
              <dd>{halalasToSar(funding)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>{d.prizes.tableTotal}</dt>
              <dd>{halalasToSar(prizePoolHalalas(table))}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>{d.prizes.pool}</dt>
              <dd>{halalasToSar(pool)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-muted">{d.prizes.poolNote}</p>
        </Card>
        <Card title={d.prizes.table}>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 text-start font-medium">{d.prizes.rank}</th>
                <th className="py-1 text-end font-medium">{d.prizes.amount}</th>
                <th className="py-1 text-end font-medium">{d.prizes.scaled}</th>
              </tr>
            </thead>
            <tbody className="tabular divide-y divide-line">
              {table.map((h, i) => (
                <tr key={i}>
                  <td className="py-1.5">{num(i + 1)}</td>
                  <td className="py-1.5 text-end">{halalasToSar(h)}</td>
                  <td className="py-1.5 text-end font-semibold">{halalasToSar(scaled[i] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card title={d.prizes.queue}>
        {winners.length === 0 ? (
          <p className="text-sm text-muted">{fill(d.prizes.queueEmpty, { m: num(state.config.eligibility.minMatches) })}</p>
        ) : (
          <ul className="divide-y divide-line">
            {winners.map((r) => (
              <PayoutRow key={r.playerId} row={r} month={month} amount={scaled[(r.prizeZone ?? 1) - 1] ?? 0} />
            ))}
          </ul>
        )}
      </Card>

      <Card title={d.prizes.youthTitle}>
        <p className="mb-2 text-sm text-muted">{d.prizes.youthNote}</p>
        <ul className="divide-y divide-line">
          {youth.map((r) => (
            <YouthRow key={r.playerId} row={r} month={month} />
          ))}
        </ul>
        {state.youthAwards.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {state.youthAwards.map((a) => {
              const row = rows.find((x) => x.playerId === a.playerId);
              return (
                <li key={a.id} className="rounded-lg bg-info/40 px-3 py-1.5">
                  {row ? pick(row.name) : a.playerId} · {a.award} · {date(a.at, true)}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={d.prizes.log}>
        {log.length === 0 ? (
          <p className="text-sm text-muted">{d.prizes.logEmpty}</p>
        ) : (
          <ul className="tabular space-y-1 text-xs">
            {log.map((a) => (
              <li key={a.id}>
                {date(a.at, true)} · {a.actor} · {a.action} · {a.entity}
                {a.before !== undefined && ` · ${a.before} → ${a.after}`}
                {a.reason && ` · ${a.reason}`}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={d.prizes.rules}>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm">
          {d.prizes.rulesItems.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function PayoutRow({ row, month, amount }: { row: BoardRow; month: string; amount: number }) {
  const { state, dispatch } = useStore();
  const { d, num, pick } = useT();
  const [reason, setReason] = useState('');
  const rec: PayoutRecord = state.payouts[`${month}:${row.playerId}`] ?? {
    month,
    playerId: row.playerId,
    status: 'pending_review',
    review: { idChecked: false, ibanNameMatches: false },
  };
  const move = (to: PayoutStatus) =>
    dispatch({ type: 'payoutMove', month, playerId: row.playerId, to, reason });
  const check = (field: 'idChecked' | 'ibanNameMatches', label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        className="h-4 w-4 accent-brand"
        checked={rec.review[field]}
        disabled={rec.status !== 'pending_review'}
        onChange={(e) =>
          dispatch({ type: 'payoutReview', month, playerId: row.playerId, field, value: e.target.checked })
        }
      />
      {label}
    </label>
  );
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="gold">#{num(row.prizeZone ?? 0)}</Badge>
        <span className="font-semibold">{pick(row.name)}</span>
        <span className="tabular text-sm text-muted">{halalasToSar(amount)}</span>
        <Badge tone={TONE[rec.status]}>{d.prizes.status[rec.status]}</Badge>
      </div>
      <div className="flex flex-wrap gap-4">
        {check('idChecked', d.prizes.idChecked)}
        {check('ibanNameMatches', d.prizes.ibanName)}
      </div>
      {(rec.status === 'pending_review' || rec.status === 'approved') && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
            placeholder={d.prizes.reason}
            aria-label={d.prizes.reason}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {rec.status === 'pending_review' ? (
            <Button
              size="sm"
              disabled={!reason.trim() || !canMovePayout(rec.status, 'approved', rec.review)}
              onClick={() => move('approved')}
            >
              {d.prizes.approve}
            </Button>
          ) : (
            <Button size="sm" disabled={!reason.trim()} onClick={() => move('paid')}>
              {d.prizes.markPaid}
            </Button>
          )}
          <Button size="sm" variant="danger" disabled={!reason.trim()} onClick={() => move('rejected')}>
            {d.prizes.reject}
          </Button>
        </div>
      )}
    </li>
  );
}

function YouthRow({ row, month }: { row: BoardRow; month: string }) {
  const { dispatch } = useStore();
  const { d, num, pick } = useT();
  const [award, setAward] = useState('');
  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <Badge tone="ok">#{num(row.youthTop ?? 0)}</Badge>
      <span className="font-semibold">{pick(row.name)}</span>
      <input
        className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
        placeholder={d.prizes.youthAward}
        aria-label={d.prizes.youthAward}
        value={award}
        onChange={(e) => setAward(e.target.value)}
      />
      <Button
        size="sm"
        variant="secondary"
        disabled={!award.trim()}
        onClick={() => {
          dispatch({ type: 'youthAward', month, playerId: row.playerId, award });
          setAward('');
        }}
      >
        {d.prizes.recordAward}
      </Button>
    </li>
  );
}
