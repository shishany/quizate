'use client';

import { useMemo, useState } from 'react';
import {
  matchScore,
  outcomeFor,
  seededRng,
  selectQuestions,
  totalAnswerMs,
  type Outcome,
} from '@quizate/game';
import { MatchPlayer, type MatchOutcome } from '@/components/player/MatchPlayer';
import { Button, Card } from '@/components/ui';
import { DemoChip } from '@/components/showcase/ui';
import { useT } from '@/i18n';
import { useShowcase } from '@/lib/showcase/context';
import { useS } from '@/lib/showcase/i18n';
import { boardOf, type SimPlayer } from '@/lib/showcase/sim';
import { cityById } from '@/lib/sample';
import { useStore } from '@/lib/store';

const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export function LiveCounters() {
  const { s } = useS();
  const { num } = useT();
  const { sim } = useShowcase();
  const items = [
    [s.live.playersToday, sim.counters.playersToday],
    [s.live.matchesToday, sim.counters.matchesToday],
    [s.live.questions, sim.counters.questionsAnswered],
  ] as const;
  return (
    <div className="grid grid-cols-3 gap-2" aria-live="off">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-2xl bg-card p-3 text-center shadow-sm">
          <div className="tabular text-xl font-bold text-primary sm:text-2xl">{num(value)}</div>
          <div className="text-[11px] text-muted sm:text-xs">{label}</div>
        </div>
      ))}
    </div>
  );
}

export function LiveFeed() {
  const { s, lang } = useS();
  const { num } = useT();
  const { sim } = useShowcase();
  const byId = (id: string) => sim.players.find((p) => p.id === id);
  return (
    <Card title={s.live.feed} action={<DemoChip />} className="bg-card">
      <ul className="space-y-1.5 text-sm">
        {sim.feed.map((f) => {
          const w = byId(f.winnerId);
          if (!w) return null;
          return (
            <li key={f.id} className="flex items-center gap-2 rounded-lg bg-bg px-3 py-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-action" aria-hidden />
              <span>
                {fill(w.female ? s.live.won.f : s.live.won.m, {
                  name: w.name[lang],
                  city: cityById(w.cityId).name[lang],
                  d: num(f.delta),
                })}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function LiveBoard() {
  const { s, lang } = useS();
  const { num } = useT();
  const { sim } = useShowcase();
  const top = boardOf(sim).slice(0, 8);
  return (
    <Card title={s.live.board} action={<DemoChip />} className="bg-card">
      <ol className="divide-y divide-line">
        {top.map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center gap-3 py-2 transition-colors ${i < 3 ? 'bg-highlight/15' : ''}`}
          >
            <span className="tabular grid h-7 w-7 place-items-center rounded-full bg-highlight/40 text-xs font-bold">
              {num(i + 1)}
            </span>
            <span className="flex-1 truncate font-semibold">
              {p.name[lang]}{' '}
              <span className="text-xs font-normal text-muted">
                {cityById(p.cityId).name[lang]}
              </span>
            </span>
            {p.youth && (
              <span className="rounded-full bg-info px-2 text-[11px] font-semibold">
                {s.live.youth}
              </span>
            )}
            <span className="tabular font-bold">{num(p.rating)}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'search'; opponent: SimPlayer }
  | { kind: 'play'; opponent: SimPlayer; seed: number }
  | { kind: 'done'; opponent: SimPlayer; outcome: Outcome; me: number; them: number };

/** An instant practice match against a simulated player: opponent in 2 s; nothing is saved. */
export function DemoMatch() {
  const { s, lang } = useS();
  const { num } = useT();
  const { state } = useStore();
  const { sim } = useShowcase();
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const seed = useMemo(() => (phase.kind === 'play' ? phase.seed : 0), [phase]);
  const questions = useMemo(() => {
    if (phase.kind !== 'play') return [];
    const r = selectQuestions(
      state.questions,
      new Map(),
      new Date(),
      state.config,
      seededRng(seed),
      {
        enforceRepeatRule: false,
      },
    );
    return r.ok ? r.questions : [];
  }, [phase.kind, seed, state.questions, state.config]);

  function start() {
    const opponent = sim.players[Math.floor(Math.random() * sim.players.length)]!;
    setPhase({ kind: 'search', opponent });
    setTimeout(() => setPhase({ kind: 'play', opponent, seed: Date.now() % 2_147_483_647 }), 2000);
  }

  function done(o: MatchOutcome) {
    if (phase.kind !== 'play') return;
    const me = matchScore(o.mine, state.config);
    const them = matchScore(o.theirs, state.config);
    const outcome = outcomeFor(
      me,
      them,
      totalAnswerMs(o.mine, state.config),
      totalAnswerMs(o.theirs, state.config),
    );
    setPhase({ kind: 'done', opponent: phase.opponent, outcome, me, them });
  }

  return (
    <Card title={s.live.matchTitle} action={<DemoChip />} className="bg-card">
      <div data-tour="match">
        {phase.kind === 'idle' && (
          <>
            <p className="mb-3 text-sm text-muted">{s.live.matchBody}</p>
            <button
              type="button"
              onClick={start}
              className="w-full rounded-xl bg-action px-5 py-3 text-[19px] font-bold text-white"
            >
              {s.live.matchCta}
            </button>
          </>
        )}
        {phase.kind === 'search' && (
          <p className="py-6 text-center font-semibold" aria-live="polite">
            {s.live.searching}
          </p>
        )}
        {phase.kind === 'play' && questions.length > 0 && (
          <>
            <p className="mb-2 text-sm font-semibold text-primary">
              {fill(s.live.found, {
                name: phase.opponent.name[lang],
                city: cityById(phase.opponent.cityId).name[lang],
              })}
            </p>
            <MatchPlayer
              seed={seed}
              mode="practice"
              questions={questions}
              opponent={{
                id: phase.opponent.id,
                name: { ar: phase.opponent.name.ar, en: phase.opponent.name.en },
                rating: phase.opponent.rating,
                cityId: phase.opponent.cityId,
                bandLabel: null,
              }}
              onDone={done}
            />
          </>
        )}
        {phase.kind === 'done' && (
          <div className="text-center">
            <p className="text-2xl font-bold">{s.live.result[phase.outcome]}</p>
            <p className="tabular mt-1 text-sm">
              {fill(s.live.score, { me: num(phase.me), them: num(phase.them) })}
            </p>
            <p className="mt-1 text-xs text-muted">{s.live.notSaved}</p>
            <Button className="mt-3" variant="secondary" onClick={() => setPhase({ kind: 'idle' })}>
              {s.live.again}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
