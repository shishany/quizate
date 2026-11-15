'use client';

import { useState } from 'react';
import { halalasToSar, monthlyPoolHalalas, riyadhMonthKey, scaledPrizeTable } from '@quizate/game';
import { DemoChip, SCard } from '@/components/showcase/ui';
import { SAMPLE_SPONSORS, sampleCampaigns } from '@/data/sponsors';
import { useT } from '@/i18n';
import { useS } from '@/lib/showcase/i18n';
import {
  TRADITIONAL_AD_SECONDS,
  ATTENTION_SECONDS_PER_VIEW,
  attentionSeconds,
  poolShareOf,
  sponsorCalc,
} from '@/lib/showcase/sponsor-math';
import { campaignRows, fundingForMonth } from '@/lib/sponsorship';
import { useStore } from '@/lib/store';

const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export default function ShowcaseSponsor() {
  const { s, lang } = useS();
  const { num } = useT();
  const { state } = useStore();
  const now = new Date();
  const month = riyadhMonthKey(now);
  const price = state.config.sponsor.defaultPricePer1000Halalas;
  const campaigns = sampleCampaigns(now, {}, price);
  const campaign = campaigns[0]!;
  const sponsor = SAMPLE_SPONSORS.find((x) => x.id === campaign.sponsorId);
  const rows = campaignRows(campaign, [], now);
  const t = rows.reduce(
    (a, r) => ({
      views: a.views + r.views,
      answers: a.answers + r.answers,
      correct: a.correct + r.correct,
    }),
    { views: 0, answers: 0, correct: 0 },
  );
  const fundingAll = fundingForMonth(campaigns, [], month, now);
  const fundingThis = fundingForMonth([campaign], [], month, now);
  const pool = monthlyPoolHalalas(state.config.prizeTableHalalas, fundingAll);
  const scaled = scaledPrizeTable(state.config.prizeTableHalalas, pool);

  const [q, setQ] = useState(2);
  const [players, setPlayers] = useState(5000);
  const [sar, setSar] = useState(price / 100);
  const calc = sponsorCalc({
    questionsPerMatch: q,
    dailyPlayers: players,
    pricePer1000Halalas: Math.round(sar * 100),
  });

  const stat = (label: string, value: string) => (
    <div className="rounded-xl bg-bg p-3 text-center">
      <div className="tabular text-lg font-bold">{value}</div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  );
  const input = (label: string, value: number, set: (n: number) => void, step = 1) => (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        step={step}
        dir="ltr"
        value={value}
        onChange={(e) => set(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-lg border border-line bg-card px-3 py-2"
      />
    </label>
  );

  return (
    <>
      <section className="rounded-2xl bg-ink p-5 text-white">
        <h1 className="text-2xl font-bold">{s.sponsor.title}</h1>
        <p className="mt-1 text-sm text-white/85">{s.sponsor.intro}</p>
      </section>

      <div data-tour="sponsor" className="space-y-4">
        <SCard
          title={fill(s.sponsor.campaign, { name: sponsor ? sponsor.name[lang] : campaign.id })}
          action={<DemoChip />}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stat(s.sponsor.views, num(t.views))}
            {stat(s.sponsor.answers, num(t.answers))}
            {stat(
              s.sponsor.correct,
              `${num(t.answers ? Math.round((t.correct / t.answers) * 100) : 0)}%`,
            )}
            {stat(s.sponsor.attention, num(attentionSeconds(t.views)))}
          </div>
          <h3 className="mb-2 mt-4 text-sm font-bold">{s.sponsor.compare}</h3>
          <div className="space-y-2 text-sm">
            <div>
              <div className="mb-1 flex justify-between">
                <span>{s.sponsor.sabbaq}</span>
                <span className="tabular font-bold">{num(attentionSeconds(1000))}</span>
              </div>
              <div className="h-3 rounded-full bg-primary" />
            </div>
            <div>
              <div className="mb-1 flex justify-between">
                <span>{s.sponsor.traditional}</span>
                <span className="tabular font-bold">{num(TRADITIONAL_AD_SECONDS * 1000)}</span>
              </div>
              <div
                className="h-3 rounded-full bg-action"
                style={{ width: `${(TRADITIONAL_AD_SECONDS / ATTENTION_SECONDS_PER_VIEW) * 100}%` }}
              />
            </div>
            <p className="font-semibold text-primary">
              {fill(s.sponsor.times, {
                n: num(ATTENTION_SECONDS_PER_VIEW / TRADITIONAL_AD_SECONDS),
              })}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {stat(s.sponsor.cpm, `${halalasToSar(campaign.pricePer1000Halalas)} SAR`)}
            {stat(s.sponsor.poolShare, `${num(Math.round(poolShareOf(fundingThis) * 100))}%`)}
          </div>
        </SCard>

        <SCard title={s.sponsor.calc}>
          <div className="grid gap-3 sm:grid-cols-3">
            {input(s.sponsor.calcQ, q, setQ)}
            {input(s.sponsor.calcPlayers, players, setPlayers, 500)}
            {input(s.sponsor.calcPrice, sar, setSar, 5)}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {stat(s.sponsor.calcViews, num(calc.monthlyViews))}
            {stat(s.sponsor.calcSar, halalasToSar(calc.monthlyHalalas))}
          </div>
          <p className="mt-2 text-sm font-semibold text-primary">
            {fill(s.sponsor.calcPool, { p: num(Math.round(calc.poolShare * 100)) })}
          </p>
          <p className="mt-1 text-xs text-muted">{s.sponsor.calcNote}</p>
        </SCard>
      </div>

      <SCard title={s.sponsor.prizes} action={<DemoChip />}>
        <div data-tour="prizes">
          <p className="text-sm text-muted">{s.sponsor.prizesBody}</p>
          <div className="mt-3 rounded-xl bg-highlight/25 p-3">
            <div className="text-xs text-muted">{s.sponsor.pool}</div>
            <div className="tabular text-2xl font-bold">{halalasToSar(pool)} SAR</div>
          </div>
          <ol className="mt-3 grid grid-cols-3 gap-2 text-center">
            {scaled.slice(0, 3).map((h, i) => (
              <li key={i} className="rounded-xl bg-bg p-2">
                <div className="text-[11px] text-muted">
                  {fill(s.sponsor.place, { n: num(i + 1) })}
                </div>
                <div className="tabular font-bold">{halalasToSar(h)}</div>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-sm">{s.sponsor.youthAward}</p>
          <p className="mt-1 text-xs text-muted">{s.sponsor.locked}</p>
        </div>
      </SCard>
    </>
  );
}
