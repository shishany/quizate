'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { monthFreezeAt, rankedAllowed, rankedLeftToday } from '@quizate/game';
import {
  DailyClaim,
  EngagementBar,
  MirrorCard,
  Missions,
  QuestionOfDay,
  useEngagement,
} from '@/components/player/engagement';
import { Badge, Card, Notice, Progress, Stat } from '@/components/ui';
import { useT } from '@/i18n';
import { ENG, ROMAN } from '@/lib/engagement';
import { useBoard } from '@/lib/standings';
import { useStore } from '@/lib/store';

export default function Home() {
  const { state } = useStore();
  const { d, fill, num, date, pick } = useT();
  const { me } = useBoard();
  const e = useEngagement();
  const cfg = state.config;
  const now = new Date();
  const history = state.myResults.map((r) => ({ at: r.at, opponentId: r.opponentId }));
  const limits = rankedAllowed(history, state.abandons, now, cfg);
  const needsIban =
    state.ibanRequiredAt === 'ranked' && !(state.player?.identityVerifiedAt && state.player.iban);
  const left = rankedLeftToday(history, now, cfg);
  const tier = ENG.ladder.tiers[e.ladder.tierIndex];
  const blocked = needsIban
    ? d.home.ibanNeeded
    : !limits.ok
      ? limits.reason === 'DAILY_LIMIT'
        ? d.home.dailyLimit
        : fill(d.home.abandonBlock, { time: date(limits.resetsAt, true) })
      : null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        {fill(d.home.greeting, { name: state.player?.name ?? '' })}
      </h1>
      <EngagementBar />
      {!(state.player?.identityVerifiedAt && state.player.iban) && (
        <Link
          href="/play/profile#verify"
          className="flex items-center justify-between gap-3 rounded-2xl border border-[#0e7a5a]/30 bg-[#e9f6f1] p-4 text-[#0b5a43]"
        >
          <span>
            <span className="block font-bold">{d.home.verifyTitle}</span>
            <span className="block text-sm">{d.home.verifyBody}</span>
          </span>
          <span className="shrink-0 rounded-xl bg-[#0e7a5a] px-3 py-2 text-sm font-semibold text-white">
            {d.home.verifyCta}
          </span>
        </Link>
      )}
      <DailyClaim />

      <Card
        title={d.home.monthTitle}
        action={
          <Link
            href="/play/ladder"
            className="rounded-full bg-gold/15 px-3 py-1 text-xs font-bold text-gold-ink hover:bg-gold/25"
          >
            {tier ? pick(tier.name) : ''} {e.ladder.division ? ROMAN[e.ladder.division] : ''}
          </Link>
        }
      >
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={d.home.myRank}
            value={me && me.counted ? `#${num(me.rank)}` : '—'}
            hint={me && me.counted ? null : d.home.unranked}
          />
          <Stat label={d.home.myPoints} value={num(me?.points ?? 0, 1)} />
        </div>
        <div className="mt-4 space-y-3 text-sm">
          <div>
            <div className="mb-1 flex justify-between">
              <span>{d.home.cap}</span>
              <span className="tabular text-muted">
                {num(me?.counted ?? 0)} / {num(cfg.monthlyCap)}
              </span>
            </div>
            <Progress value={me?.counted ?? 0} max={cfg.monthlyCap} label={d.home.cap} />
          </div>
          {me?.eligible ? (
            <Badge tone="ok">{d.home.eligible}</Badge>
          ) : (
            <>
              <p className="text-xs text-muted">
                {fill(d.home.notEligible, {
                  m: num(cfg.eligibility.minMatches),
                  o: num(cfg.eligibility.minOpponents),
                })}
              </p>
              <div>
                <div className="mb-1 flex justify-between">
                  <span>{d.home.counted}</span>
                  <span className="tabular text-muted">
                    {num(Math.min(me?.counted ?? 0, cfg.eligibility.minMatches))} /{' '}
                    {num(cfg.eligibility.minMatches)}
                  </span>
                </div>
                <Progress
                  value={me?.counted ?? 0}
                  max={cfg.eligibility.minMatches}
                  tone="gold"
                  label={d.home.counted}
                />
              </div>
              <div>
                <div className="mb-1 flex justify-between">
                  <span>{d.home.opponents}</span>
                  <span className="tabular text-muted">
                    {num(Math.min(me?.distinctOpponents ?? 0, cfg.eligibility.minOpponents))} /{' '}
                    {num(cfg.eligibility.minOpponents)}
                  </span>
                </div>
                <Progress
                  value={me?.distinctOpponents ?? 0}
                  max={cfg.eligibility.minOpponents}
                  tone="gold"
                  label={d.home.opponents}
                />
              </div>
            </>
          )}
        </div>
        <Countdown to={monthFreezeAt(now)} />
      </Card>

      <ModeCard
        title={d.home.rankedTitle}
        body={d.home.rankedBody}
        meta={fill(d.home.rankedLeft, { n: num(left), max: num(cfg.dailyRankedLimit) })}
        href="/play/ranked"
        accent="brand"
        disabled={Boolean(blocked)}
        blocked={blocked}
      />
      <MirrorCard />
      <ModeCard
        title={d.home.practiceTitle}
        body={d.home.practiceBody}
        href="/play/practice"
        accent="ok"
      />
      <ModeCard
        title={d.home.speedTitle}
        body={fill(d.home.speedBody, { s: num(cfg.speedRound.seconds) })}
        meta={state.speedBest ? fill(d.home.speedBest, { n: num(state.speedBest) }) : undefined}
        href="/play/speed"
        accent="gold"
      />
      <Missions />
      <QuestionOfDay />
    </div>
  );
}

function ModeCard({
  title,
  body,
  meta,
  href,
  accent,
  disabled,
  blocked,
}: {
  title: string;
  body: string;
  meta?: string;
  href: string;
  accent: 'brand' | 'ok' | 'gold';
  disabled?: boolean;
  blocked?: string | null;
}) {
  const { d } = useT();
  const bar = { brand: 'bg-brand', ok: 'bg-ok', gold: 'bg-gold' }[accent];
  return (
    <Card className="relative overflow-hidden">
      <span className={`absolute inset-y-0 start-0 w-1.5 ${bar}`} aria-hidden />
      <div className="flex items-center justify-between gap-4 ps-2">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{body}</p>
          {meta && <p className="mt-1.5 text-xs font-semibold text-brand-deep">{meta}</p>}
        </div>
        {disabled ? (
          <span className="shrink-0 rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-400">
            {d.home.play}
          </span>
        ) : (
          <Link
            href={href}
            className="bg-brand-gradient shrink-0 rounded-xl px-5 py-3 font-semibold text-white shadow-sm hover:opacity-95"
          >
            {d.home.play}
          </Link>
        )}
      </div>
      {blocked && (
        <div className="mt-3 ps-2">
          <Notice tone="warn">{blocked}</Notice>
        </div>
      )}
    </Card>
  );
}

function Countdown({ to }: { to: Date }) {
  const { d, num } = useT();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const ms = Math.max(0, to.getTime() - now);
  const parts = [
    [Math.floor(ms / 86_400_000), d.home.days],
    [Math.floor((ms % 86_400_000) / 3_600_000), d.home.hours],
    [Math.floor((ms % 3_600_000) / 60_000), d.home.minutes],
  ] as const;
  return (
    <div className="mt-4 rounded-xl bg-navy px-4 py-3 text-white">
      <div className="mb-1 text-xs text-white/70">{d.home.monthEnds}</div>
      <div className="flex gap-4">
        {parts.map(([value, label]) => (
          <div key={label} className="flex flex-col items-center">
            <span className="tabular text-xl font-bold leading-tight">{num(value)}</span>
            <span className="text-[11px] text-white/70">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
