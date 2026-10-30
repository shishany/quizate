'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { seededRng, shuffle } from '@quizate/game';
import { Badge, Button, Card, Stat } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/lib/store';
import type { Question } from '@/lib/types';
import type { BiText } from '@/data/questions';
import { QuestionImage } from '@/components/QuestionImage';

const FEEDBACK_MS = 350;

/** Speed round: unranked, as many correct answers as possible within the configured time. */
export default function SpeedPage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick } = useT();
  const router = useRouter();
  const seconds = state.config.speedRound.seconds;
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [deck, setDeck] = useState<{ q: Question; order: number[] }[]>([]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [flash, setFlash] = useState<{ opt: number; ok: boolean } | null>(null);
  const [left, setLeft] = useState(seconds * 1000);
  const endsAt = useRef(0);
  const [prevBest, setPrevBest] = useState(state.speedBest);

  function start() {
    const rng = seededRng(Date.now() % 2_147_483_647);
    const pool = shuffle(
      state.questions.filter((q) => q.status === 'published'),
      rng,
    );
    setDeck(
      pool.map((q) => ({
        q,
        order: shuffle(
          q.options.map((_, k) => k),
          rng,
        ),
      })),
    );
    setI(0);
    setCorrect(0);
    setAnswered(0);
    setFlash(null);
    setPrevBest(state.speedBest);
    endsAt.current = performance.now() + seconds * 1000;
    setLeft(seconds * 1000);
    setPhase('running');
  }

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const remaining = endsAt.current - performance.now();
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) setPhase('done');
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') dispatch({ type: 'speedFinished', correct, answered });
  }, [phase, correct, answered, dispatch]);

  const answer = useCallback(
    (opt: number) => {
      if (phase !== 'running' || flash) return;
      const ok = opt === 0;
      setFlash({ opt, ok });
      setAnswered((a) => a + 1);
      if (ok) setCorrect((c) => c + 1);
      setTimeout(() => {
        setFlash(null);
        setI((x) => (x + 1) % Math.max(1, deck.length));
      }, FEEDBACK_MS);
    },
    [phase, flash, deck.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const order = deck[i]?.order;
      if (order && n >= 1 && n <= 4) answer(order[n - 1] as number);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, deck, i]);

  const card = deck[i];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.speed.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/play')}>
          {d.common.back}
        </Button>
      </div>

      {phase === 'ready' && (
        <Card>
          <p className="text-muted">{fill(d.speed.intro, { s: num(seconds) })}</p>
          {state.speedBest > 0 && (
            <p className="mt-2 text-sm font-semibold">
              {d.speed.best}: {num(state.speedBest)}
            </p>
          )}
          <Button className="mt-4 w-full" size="lg" onClick={start}>
            {d.speed.start}
          </Button>
        </Card>
      )}

      {phase === 'running' && card && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label={d.speed.timeLeft}
              value={`${num(Math.ceil(left / 1000))} ${d.common.sec}`}
            />
            <Stat label={d.speed.correct} value={num(correct)} />
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
            <div
              className={`h-full ${left < 10_000 ? 'bg-bad' : 'bg-gold'}`}
              style={{ width: `${(left / (seconds * 1000)) * 100}%` }}
            />
          </div>
          <Card>
            <div className="mb-2 flex justify-end">
              {card.q.sponsored && <Badge tone="gold">{d.common.sponsored}</Badge>}
            </div>
            <QuestionImage id={card.q.image} className="mb-3" />
            <h2 className="mb-4 text-lg font-bold leading-relaxed">{pick(card.q.text)}</h2>
            <div className="grid gap-2.5">
              {card.order.map((opt, pos) => {
                let cls = 'border-line bg-white hover:border-brand hover:bg-brand/5';
                if (flash)
                  cls =
                    opt === 0
                      ? 'border-ok bg-ok-bg'
                      : flash.opt === opt
                        ? 'border-bad bg-bad-bg'
                        : 'border-line bg-white opacity-60';
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => answer(opt)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border-2 px-4 py-3 text-start font-medium ${cls}`}
                  >
                    <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm text-muted">
                      {num(pos + 1)}
                    </span>
                    <bdi>{pick(card.q.options[opt] as BiText)}</bdi>
                  </button>
                );
              })}
            </div>
          </Card>
        </>
      )}

      {phase === 'done' && (
        <Card className="text-center">
          <p className="text-sm font-semibold text-muted">{d.speed.done}</p>
          <p className="tabular my-2 text-5xl font-black text-brand-deep">{num(correct)}</p>
          <p className="text-sm text-muted">
            {d.speed.correct} · {num(answered)}
          </p>
          {correct > prevBest && (
            <Badge tone="gold" className="mt-3">
              {d.speed.newBest}
            </Badge>
          )}
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Button size="lg" onClick={start}>
              {d.speed.again}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => router.push('/play')}>
              {d.result.home}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
