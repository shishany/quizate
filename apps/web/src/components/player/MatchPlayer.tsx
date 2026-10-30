'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { botAnswer, seededRng, shuffle, type AnswerRecord } from '@quizate/game';
import { Badge, Button } from '@/components/ui';
import { useT } from '@/i18n';
import { cityById } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { BiText } from '@/data/questions';
import type { Question } from '@/lib/types';

export interface Opponent {
  id: string;
  name: BiText;
  rating: number;
  cityId: string;
  bandLabel: string | null;
}

export interface MatchOutcome {
  mine: AnswerRecord[];
  theirs: AnswerRecord[];
  forfeit: boolean;
  /** Option order shown to the player, per question (indices into question.options). */
  orders: number[][];
}

const REVEAL_MS = 1800;
const INTRO_MS = 1500;

/**
 * One 1v1 match. In the web sample the browser plays the server's part: it shows each question to both players at
 * the same moment, records the time of each answer, and reveals correctness only once the question closes (both
 * answered, or the time limit passed). The production server owns all of this (architecture rule 1).
 */
export function MatchPlayer({
  seed,
  mode,
  questions,
  opponent,
  onDone,
}: {
  seed: number;
  mode: 'ranked' | 'practice';
  questions: Question[];
  opponent: Opponent;
  onDone: (outcome: MatchOutcome) => void;
}) {
  const { state } = useStore();
  const { d, fill, num, pick } = useT();
  const cfg = state.config;
  const limitMs = cfg.questionSeconds * 1000;

  const theirs = useMemo<AnswerRecord[]>(() => {
    const rng = seededRng(seed);
    return questions.map((q) => {
      const a = botAnswer(opponent.rating, q.difficulty, cfg, rng);
      return {
        option: a.latencyMs === null ? null : a.correct ? 0 : 1 + Math.floor(rng() * 3),
        correct: a.correct,
        latencyMs: a.latencyMs,
      };
    });
  }, [seed, questions, opponent.rating, cfg]);

  const orders = useMemo(() => {
    const rng = seededRng(seed + 7);
    return questions.map((q) =>
      shuffle(
        q.options.map((_, i) => i),
        rng,
      ),
    );
  }, [seed, questions]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'question' | 'reveal'>('intro');
  const [elapsed, setElapsed] = useState(0);
  const [mine, setMine] = useState<AnswerRecord[]>([]);
  const shownAt = useRef(0);
  const done = useRef(false);

  const q = questions[index] as Question;
  const myAnswer = mine[index];
  const their = theirs[index] as AnswerRecord;
  const theirAnswered = their.latencyMs !== null && elapsed >= their.latencyMs;

  const finish = useCallback(
    (answers: AnswerRecord[], forfeit: boolean) => {
      if (done.current) return;
      done.current = true;
      const filled = questions.map(
        (_, i) => answers[i] ?? { option: null, correct: false, latencyMs: null },
      );
      onDone({ mine: filled, theirs, forfeit, orders });
    },
    [questions, theirs, orders, onDone],
  );

  // Intro, then show question 0.
  useEffect(() => {
    if (phase !== 'intro') return;
    const t = setTimeout(() => {
      shownAt.current = performance.now();
      setElapsed(0);
      setPhase('question');
    }, INTRO_MS);
    return () => clearTimeout(t);
  }, [phase]);

  // The question clock.
  useEffect(() => {
    if (phase !== 'question') return;
    const id = setInterval(() => setElapsed(performance.now() - shownAt.current), 100);
    return () => clearInterval(id);
  }, [phase, index]);

  // Close the question when both have answered or the limit passes.
  useEffect(() => {
    if (phase !== 'question') return;
    const theirDone = their.latencyMs === null ? elapsed >= limitMs : elapsed >= their.latencyMs;
    if (elapsed >= limitMs || (myAnswer && theirDone)) {
      if (!myAnswer)
        setMine((m) => {
          const next = [...m];
          next[index] = { option: null, correct: false, latencyMs: null };
          return next;
        });
      setPhase('reveal');
    }
  }, [elapsed, phase, myAnswer, their, limitMs, index]);

  // After the reveal, next question or the end.
  useEffect(() => {
    if (phase !== 'reveal') return;
    const t = setTimeout(() => {
      if (index + 1 >= questions.length) return finish(mine, false);
      setIndex(index + 1);
      shownAt.current = performance.now();
      setElapsed(0);
      setPhase('question');
    }, REVEAL_MS);
    return () => clearTimeout(t);
  }, [phase, index, questions.length, finish, mine]);

  const answer = useCallback(
    (optionIndex: number) => {
      if (phase !== 'question' || mine[index]) return;
      const latencyMs = Math.round(performance.now() - shownAt.current);
      if (latencyMs > limitMs) return;
      setMine((m) => {
        const next = [...m];
        next[index] = { option: optionIndex, correct: optionIndex === 0, latencyMs };
        return next;
      });
    },
    [phase, mine, index, limitMs],
  );

  // Keys 1-4 answer on a keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      const order = orders[index];
      if (order && n >= 1 && n <= 4) answer(order[n - 1] as number);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, orders, index]);

  function leave() {
    if (window.confirm(mode === 'ranked' ? d.match.leaveRanked : d.match.leavePractice))
      finish(mine, true);
  }

  const closed = (i: number) => i < index || (i === index && phase === 'reveal');
  const myScore = mine.filter((a, i) => closed(i) && a?.correct).length * cfg.pointsPerCorrect;
  const theirScore = theirs.filter((a, i) => closed(i) && a.correct).length * cfg.pointsPerCorrect;
  const remaining = Math.max(0, Math.ceil((limitMs - elapsed) / 1000));

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <Badge tone={mode === 'ranked' ? 'brand' : 'ok'}>
          {mode === 'ranked' ? d.match.ranked : d.match.practice}
        </Badge>
        <Button variant="ghost" size="sm" onClick={leave}>
          {d.match.leave}
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <PlayerSide
          name={state.player?.name ?? d.match.you}
          sub={d.match.you}
          score={myScore}
          status={myAnswer && phase === 'question' ? d.match.answered : null}
        />
        <span className="text-sm font-bold text-muted">VS</span>
        <PlayerSide
          name={pick(opponent.name)}
          sub={
            opponent.bandLabel
              ? `${pick(cityById(opponent.cityId).name)} · ${opponent.bandLabel}`
              : `${d.mm.rating} ${num(opponent.rating)}`
          }
          score={theirScore}
          status={
            phase === 'question' ? (theirAnswered ? d.match.answered : d.match.thinking) : null
          }
          end
        />
      </div>

      <ol
        className="flex justify-center gap-1.5"
        aria-label={fill(d.match.questionOf, { i: num(index + 1), n: num(questions.length) })}
      >
        {questions.map((qq, i) => {
          const a = mine[i];
          const tone = !closed(i)
            ? i === index
              ? 'bg-brand'
              : 'bg-slate-200'
            : a?.correct
              ? 'bg-ok'
              : 'bg-bad';
          return <li key={qq.id} className={`h-2 w-6 rounded-full ${tone}`} />;
        })}
      </ol>

      {phase === 'intro' ? (
        <div className="grid h-72 place-items-center rounded-2xl bg-white text-lg font-semibold text-muted shadow-sm">
          {d.match.starting}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted">
              {fill(d.match.questionOf, { i: num(index + 1), n: num(questions.length) })}
            </span>
            <div className="flex items-center gap-2">
              {q.sponsored && <Badge tone="gold">{d.common.sponsored}</Badge>}
              <TimerRing
                remaining={remaining}
                fraction={phase === 'reveal' ? 0 : Math.max(0, 1 - elapsed / limitMs)}
              />
            </div>
          </div>
          <h2 className="mb-4 min-h-[3.5rem] text-lg font-bold leading-relaxed sm:text-xl">
            {pick(q.text)}
          </h2>
          <div className="grid gap-2.5">
            {(orders[index] ?? []).map((opt, pos) => {
              const isMine = myAnswer?.option === opt;
              const isTheirs = phase === 'reveal' && their.option === opt;
              let cls = 'border-line bg-white hover:border-brand hover:bg-brand/5';
              if (phase === 'reveal') {
                if (opt === 0) cls = 'border-ok bg-ok-bg';
                else if (isMine) cls = 'border-bad bg-bad-bg';
                else cls = 'border-line bg-white opacity-70';
              } else if (isMine) cls = 'border-brand bg-brand/10';
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={phase !== 'question' || Boolean(myAnswer)}
                  onClick={() => answer(opt)}
                  className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-start font-medium transition-colors disabled:cursor-default ${cls}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm text-muted">
                      {num(pos + 1)}
                    </span>
                    <bdi>{pick(q.options[opt] as BiText)}</bdi>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    {phase === 'reveal' && isMine && (
                      <Badge tone={opt === 0 ? 'ok' : 'bad'}>{d.match.yourAnswer}</Badge>
                    )}
                    {isTheirs && <Badge tone="neutral">{pick(opponent.name)}</Badge>}
                  </span>
                </button>
              );
            })}
          </div>
          {phase === 'reveal' && !myAnswer?.option && myAnswer?.option !== 0 && (
            <p className="mt-3 text-sm font-medium text-warn">{d.match.timeUp}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlayerSide({
  name,
  sub,
  score,
  status,
  end,
}: {
  name: string;
  sub: string;
  score: number;
  status: string | null;
  end?: boolean;
}) {
  const { num } = useT();
  return (
    <div className={`min-w-0 ${end ? 'text-end' : ''}`}>
      <div className="truncate font-bold">{name}</div>
      <div className="truncate text-xs text-muted">{sub}</div>
      <div className={`mt-1 flex items-center gap-2 ${end ? 'justify-end' : ''}`}>
        <span className="tabular text-2xl font-black text-brand-deep">{num(score)}</span>
        {status && <span className="text-xs text-muted">{status}</span>}
      </div>
    </div>
  );
}

function TimerRing({ remaining, fraction }: { remaining: number; fraction: number }) {
  const { num } = useT();
  const r = 18;
  const c = 2 * Math.PI * r;
  const tone = remaining <= 5 ? 'stroke-bad' : 'stroke-brand';
  return (
    <span className="relative grid h-11 w-11 place-items-center" role="timer" aria-live="off">
      <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
        <circle cx="22" cy="22" r={r} className="fill-none stroke-slate-100" strokeWidth="4" />
        <circle
          cx="22"
          cy="22"
          r={r}
          className={`fill-none ${tone} transition-[stroke-dashoffset] duration-100`}
          strokeWidth="4"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - fraction)}
          strokeLinecap="round"
        />
      </svg>
      <span className="tabular text-sm font-bold">{num(remaining)}</span>
    </span>
  );
}
