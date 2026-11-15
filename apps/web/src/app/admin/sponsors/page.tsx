'use client';

import { useState } from 'react';
import { campaignLive, reportCsv } from '@quizate/game';
import { Badge, Button, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/lib/store';
import { SAMPLE_SPONSORS, sampleCampaigns } from '@/data/sponsors';
import { campaignRows } from '@/lib/sponsorship';

/**
 * CR v3 section 8: sponsors, their campaigns, and each campaign's report (views, answers, % correct by day) with
 * CSV export. Aggregates only: sponsors never see personal data (architecture rule 9).
 */
export default function SponsorsPage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, date } = useT();
  const [price, setPrice] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const now = new Date();
  const campaigns = sampleCampaigns(now, state.campaignPrices, state.config.sponsor.defaultPricePer1000Halalas);
  const [selected, setSelected] = useState(campaigns[0]?.id ?? '');
  const campaign = campaigns.find((c) => c.id === selected) ?? campaigns[0];
  if (!campaign) return null;
  const sponsor = SAMPLE_SPONSORS.find((s) => s.id === campaign.sponsorId);
  const rows = campaignRows(campaign, state.sponsorEvents, now);
  const total = rows.reduce(
    (t, r) => ({
      views: t.views + r.views,
      billable: t.billable + r.billableViews,
      answers: t.answers + r.answers,
      correct: t.correct + r.correct,
    }),
    { views: 0, billable: 0, answers: 0, correct: 0 },
  );
  const questions = state.questions.filter((q) => q.campaignId === campaign.id);
  const mine = state.sponsorEvents.filter((e) => e.campaignId === campaign.id);

  function exportCsv() {
    const blob = new Blob([reportCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaign-${campaign!.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.sponsors.title}</h1>
      <Card title={d.sponsors.campaigns} className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {[d.sponsors.sponsor, d.sponsors.dates, d.sponsors.quota, d.sponsors.price, d.sponsors.status].map((h) => (
                <th key={h} className="py-2 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            {campaigns.map((c) => {
              const s = SAMPLE_SPONSORS.find((x) => x.id === c.sponsorId);
              return (
                <tr
                  key={c.id}
                  className={`cursor-pointer ${c.id === campaign.id ? 'bg-highlight/15' : ''}`}
                  onClick={() => setSelected(c.id)}
                >
                  <td className="py-2 font-medium">{s ? pick(s.name) : c.sponsorId}</td>
                  <td className="py-2">
                    {date(c.startsAt)} – {date(c.endsAt)}
                  </td>
                  <td className="py-2">{num(c.viewQuota)}</td>
                  <td className="py-2">{fill(d.sponsors.priceValue, { sar: num(c.pricePer1000Halalas / 100, 2) })}</td>
                  <td className="py-2">
                    {campaignLive(c, now) ? <Badge tone="ok">{d.sponsors.live}</Badge> : <Badge>{d.sponsors.ended}</Badge>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="block text-xs text-muted">{d.sponsors.setPrice}</span>
            <input
              inputMode="decimal"
              dir="ltr"
              className="w-28 rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
              placeholder={String(campaign.pricePer1000Halalas / 100)}
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </label>
          <input
            className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-1.5 text-sm"
            placeholder={d.prizes.reason}
            aria-label={d.prizes.reason}
            value={priceReason}
            onChange={(e) => setPriceReason(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!Number(price) || !priceReason.trim()}
            onClick={() => {
              dispatch({
                type: 'campaignPrice',
                campaignId: campaign.id,
                halalas: Math.round(Number(price) * 100),
                reason: priceReason,
              });
              setPrice('');
              setPriceReason('');
            }}
          >
            {d.common.save}
          </Button>
          <Badge tone="violet">{d.common.sample}</Badge>
        </div>
        <p className="mt-1 text-xs text-muted">{d.sponsors.billableNote}</p>
      </Card>

      <Card
        title={`${d.sponsors.report} · ${sponsor ? pick(sponsor.name) : ''}`}
        action={
          <Button variant="secondary" size="sm" onClick={exportCsv}>
            {d.sponsors.exportCsv}
          </Button>
        }
        className="overflow-x-auto"
      >
        <div className="mb-3 grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <div className="rounded-xl bg-card p-2">
            <div className="text-xs text-muted">{d.sponsors.impressions}</div>
            <div className="tabular font-bold">{num(total.views)}</div>
          </div>
          <div className="rounded-xl bg-card p-2">
            <div className="text-xs text-muted">{d.sponsors.billable}</div>
            <div className="tabular font-bold">{num(total.billable)}</div>
          </div>
          <div className="rounded-xl bg-card p-2">
            <div className="text-xs text-muted">{d.sponsors.answers}</div>
            <div className="tabular font-bold">{num(total.answers)}</div>
          </div>
          <div className="rounded-xl bg-card p-2">
            <div className="text-xs text-muted">{d.sponsors.correctPct}</div>
            <div className="tabular font-bold">
              {total.answers ? `${num(Math.round((total.correct / total.answers) * 1000) / 10, 1)}%` : '—'}
            </div>
          </div>
        </div>
        <table className="w-full min-w-[420px] text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {[d.sponsors.day, d.sponsors.impressions, d.sponsors.billable, d.sponsors.answers, d.sponsors.correctPct].map((h) => (
                <th key={h} className="py-2 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.day}>
                <td className="py-2">{date(`${r.day}T12:00:00+03:00`)}</td>
                <td className="py-2">{num(r.views)}</td>
                <td className="py-2 font-semibold">{num(r.billableViews)}</td>
                <td className="py-2">{num(r.answers)}</td>
                <td className="py-2">{r.correctPct === null ? '—' : `${num(r.correctPct, 1)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">{d.sponsors.qualityNote}</p>
        <p className="mt-1 text-xs text-muted">
          {fill(d.sponsors.yours, {
            i: num(mine.filter((e) => e.type === 'view').length),
            a: num(mine.filter((e) => e.type === 'answer').length),
          })}
        </p>
        {questions.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-sm font-medium">{d.sponsors.questions}</div>
            <ul className="space-y-1 text-sm">
              {questions.map((q) => (
                <li key={q.id} className="rounded-lg bg-page px-3 py-1.5">
                  {pick(q.text)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
