'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { seededRng, shuffle, daySeed, riyadhDayKey } from '@quizate/game';
import { Badge, Button, Card, Progress } from '@/components/ui';
import { useT } from '@/i18n';
import { ENG, FRAME_RING, engagementSummary, missionProgress, missionsFor } from '@/lib/engagement';
import { useBoard } from '@/lib/standings';
import { useStore } from '@/lib/store';
import type { BiText } from '@/data/questions';
import { QuestionImage } from '@/components/QuestionImage';

/** Earned-only coins (architecture rule 6). */
export function Coin({ n, className = '' }: { n: number | string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 tabular ${className}`}>
      <span
        aria-hidden
        className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gold-ink/40 bg-gold"
      />
      {n}
    </span>
  );
}

export function Avatar({
  name,
  frame,
  size = 'md',
}: {
  name: string;
  frame: string | null;
  size?: 'md' | 'lg';
}) {
  const ring = frame ? (FRAME_RING[frame] ?? 'ring-sky') : 'ring-slate-200';
  const dims = size === 'lg' ? 'h-16 w-16 text-2xl ring-4' : 'h-10 w-10 text-base ring-2';
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand-deep ${ring} ${dims}`}
      aria-hidden
    >
      {name.slice(0, 1)}
    </span>
  );
}

export function useEngagement() {
  const { state } = useStore();
  const { me } = useBoard();
  return engagementSummary(state, me?.points ?? 0, me && me.counted > 0 ? me.rank : null);
}

/** Level, XP, coins and streak: the strip at the top of home. */
export function EngagementBar() {
  const { state } = useStore();
  const { d, fill, num } = useT();
  const e = useEngagement();
  return (
    <div className="bg-brand-gradient rounded-2xl p-4 text-white">
      <div className="flex items-center gap-3">
        <Avatar name={state.player?.name ?? ''} frame={state.equipped.frame} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="font-bold">{fill(d.eng.level, { n: num(e.level.level) })}</span>
            <span className="tabular text-xs text-white/80" dir="ltr">
              {num(e.level.into)} / {num(e.level.need)} XP
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-gold"
              style={{ width: `${e.level.need ? (e.level.into / e.level.need) * 100 : 100}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>
          {d.eng.streak}: <b className="tabular">{num(e.streak.days)}</b>
          {e.streak.shields > 0 && (
            <span className="ms-2 text-xs text-white/80">
              {fill(d.eng.shields, { n: num(e.streak.shields) })}
            </span>
          )}
        </span>
        <Coin n={num(e.coins)} className="font-bold" />
      </div>
    </div>
  );
}

export function DailyClaim() {
  const { dispatch } = useStore();
  const { d, fill, num } = useT();
  const e = useEngagement();
  return (
    <Card
      title={d.eng.claimTitle}
      action={
        e.claim.claimable ? (
          <Button size="sm" onClick={() => dispatch({ type: 'claimDaily' })}>
            {d.eng.claim}
          </Button>
        ) : (
          <Badge tone="ok">{d.eng.claimed}</Badge>
        )
      }
    >
      <ol className="grid grid-cols-7 gap-1.5">
        {ENG.claim.map((r, i) => {
          const done = e.claim.claimable ? i < e.claim.index : i <= e.claim.index;
          const today = e.claim.claimable && i === e.claim.index;
          return (
            <li
              key={i}
              className={`flex flex-col items-center rounded-xl px-1 py-2 text-center ${today ? 'bg-gold/20 ring-2 ring-gold' : done ? 'bg-ok-bg' : 'bg-page'}`}
            >
              <span className="text-[10px] text-muted">{fill(d.eng.day, { n: num(i + 1) })}</span>
              <Coin n={num(r.coins)} className="text-xs font-semibold" />
              {r.cosmetic && (
                <span className="mt-0.5 text-[10px] font-semibold text-violet">
                  {d.eng.cosmetic}
                </span>
              )}
              {done && <span className="text-[10px] text-ok">✓</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted">{d.eng.claimNote}</p>
    </Card>
  );
}

export function Missions() {
  const { state, dispatch } = useStore();
  const { d, num } = useT();
  const day = riyadhDayKey(new Date());
  const list = missionsFor(day);
  return (
    <Card title={d.eng.missionsTitle}>
      <ul className="space-y-3">
        {list.map((m) => {
          const progress = Math.min(m.target, missionProgress(state, m, day));
          const claimed = state.missionClaims.includes(`${day}:${m.id}`);
          return (
            <li key={m.id}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{d.missions[m.id as keyof typeof d.missions]}</span>
                {claimed ? (
                  <Badge tone="ok">{d.eng.done}</Badge>
                ) : progress >= m.target ? (
                  <Button size="sm" onClick={() => dispatch({ type: 'claimMission', id: m.id })}>
                    {d.eng.claim}
                  </Button>
                ) : (
                  <span className="tabular text-xs text-muted">
                    {num(progress)} / {num(m.target)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Progress
                    value={progress}
                    max={m.target}
                    tone="gold"
                    label={d.missions[m.id as keyof typeof d.missions]}
                  />
                </div>
                <span className="text-xs text-muted">+{num(m.xp)} XP · </span>
                <Coin n={num(m.coins)} className="text-xs" />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function QuestionOfDay() {
  const { state, dispatch } = useStore();
  const { d, pick } = useT();
  const day = riyadhDayKey(new Date());
  const q = useMemo(() => {
    const pool = state.questions.filter((x) => x.status === 'published' && !x.sponsored);
    const rng = seededRng(daySeed(new Date(), 99));
    return pool[Math.floor(rng() * pool.length)];
  }, [state.questions]);
  const order = useMemo(
    () =>
      q
        ? shuffle(
            q.options.map((_, i) => i),
            seededRng(daySeed(new Date(), 5)),
          )
        : [],
    [q],
  );
  const answered = state.questionOfDay[day];
  const [picked, setPicked] = useState<number | null>(null);
  if (!q) return null;
  return (
    <Card
      title={d.eng.qotdTitle}
      action={
        answered ? (
          <Badge tone={answered.correct ? 'ok' : 'bad'}>
            {answered.correct ? d.eng.qotdRight : d.eng.qotdWrong}
          </Badge>
        ) : (
          <span className="text-xs text-muted">+{ENG.xp.questionOfDay} XP</span>
        )
      }
    >
      <QuestionImage id={q.image} className="mb-3" />
      <p className="mb-3 font-semibold">{pick(q.text)}</p>
      <div className="grid grid-cols-2 gap-2">
        {order.map((opt) => {
          const show = Boolean(answered);
          const cls = show
            ? opt === 0
              ? 'border-ok bg-ok-bg'
              : picked === opt
                ? 'border-bad bg-bad-bg'
                : 'border-line opacity-60'
            : 'border-line hover:border-brand';
          return (
            <button
              key={opt}
              type="button"
              disabled={show}
              onClick={() => {
                setPicked(opt);
                dispatch({ type: 'questionOfDay', day, correct: opt === 0 });
              }}
              className={`rounded-xl border-2 bg-white px-3 py-2 text-start text-sm font-medium ${cls}`}
            >
              <bdi>{pick(q.options[opt] as BiText)}</bdi>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export function MirrorCard() {
  const { state } = useStore();
  const { d, fill, num } = useT();
  const done = state.mirror[riyadhDayKey(new Date())];
  return (
    <Card className="relative overflow-hidden">
      <span className="absolute inset-y-0 start-0 w-1.5 bg-violet" aria-hidden />
      <div className="flex items-center justify-between gap-4 ps-2">
        <div>
          <h2 className="text-lg font-bold">{d.mirror.title}</h2>
          <p className="mt-0.5 text-sm text-muted">{d.mirror.cardBody}</p>
          <p className="mt-1.5 text-xs font-semibold text-violet">
            {done ? fill(d.mirror.yourScore, { score: num(done.score) }) : `+${ENG.xp.mirror} XP`}
          </p>
        </div>
        <Link
          href="/play/mirror"
          className="shrink-0 rounded-xl bg-violet px-5 py-3 font-semibold text-white hover:opacity-95"
        >
          {done ? d.mirror.board : d.home.play}
        </Link>
      </div>
    </Card>
  );
}
