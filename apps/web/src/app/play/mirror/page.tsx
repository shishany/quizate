'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { daySeed, riyadhDayKey, seededRng, selectQuestions, shuffle } from '@quizate/game';
import { Badge, Button, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { ENG } from '@/lib/engagement';
import { productName } from '@/lib/product';
import { SAMPLE_PLAYERS } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { MirrorResult } from '@/lib/types';
import type { BiText } from '@/data/questions';
import { QuestionImage } from '@/components/QuestionImage';

const FEEDBACK_MS = 700;

/**
 * Mirror Challenge (تحدي المرآة, ENGAGEMENT.md section 4): the same 10 questions for every player on a Riyadh day,
 * played alone; the daily board ranks by score, then total time. XP only (architecture rule 10).
 */
export default function MirrorPage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, locale, date } = useT();
  const router = useRouter();
  const cfg = state.config;
  const now = new Date();
  const day = riyadhDayKey(now);
  const done = state.mirror[day];
  const limitMs = cfg.questionSeconds * 1000;

  const questions = useMemo(() => {
    const r = selectQuestions(
      state.questions.filter((q) => !q.sponsored),
      new Map(),
      now,
      cfg,
      seededRng(daySeed(now)),
      { enforceRepeatRule: false },
    );
    return r.ok ? r.questions : [];
  }, [day, state.questions, cfg]);
  const orders = useMemo(() => {
    const rng = seededRng(daySeed(now, 3));
    return questions.map((q) =>
      shuffle(
        q.options.map((_, i) => i),
        rng,
      ),
    );
  }, [questions]);

  const [phase, setPhase] = useState<'ready' | 'run'>('ready');
  const [i, setI] = useState(0);
  const [grid, setGrid] = useState<boolean[]>([]);
  const [timeMs, setTimeMs] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const shownAt = useRef(0);

  const next = useCallback(
    (correct: boolean, spent: number) => {
      const g = [...grid, correct];
      const t = timeMs + spent;
      setGrid(g);
      setTimeMs(t);
      setTimeout(() => {
        setFlash(null);
        if (g.length >= questions.length) {
          const result: MirrorResult = {
            at: new Date().toISOString(),
            score: g.filter(Boolean).length * cfg.pointsPerCorrect,
            timeMs: t,
            grid: g,
          };
          dispatch({ type: 'mirrorFinished', day, result });
          setPhase('ready');
        } else {
          setI(g.length);
          shownAt.current = performance.now();
          setElapsed(0);
        }
      }, FEEDBACK_MS);
    },
    [grid, timeMs, questions.length, cfg.pointsPerCorrect, dispatch, day],
  );

  useEffect(() => {
    if (phase !== 'run' || flash !== null) return;
    const id = setInterval(() => {
      const e = performance.now() - shownAt.current;
      setElapsed(e);
      if (e >= limitMs) {
        setFlash(-1);
        next(false, limitMs);
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase, flash, limitMs, next]);

  function answer(opt: number) {
    if (flash !== null) return;
    setFlash(opt);
    next(opt === 0, Math.round(performance.now() - shownAt.current));
  }

  // The daily board: sample players' results for today, the same for everyone, plus yours.
  const board = useMemo(() => {
    const rng = seededRng(daySeed(now, 11));
    const rows = SAMPLE_PLAYERS.slice(0, 24).map((p) => {
      const correct = Math.min(
        10,
        Math.max(2, Math.round(4 + rng() * 6 + (p.rating - 1200) / 200)),
      );
      return {
        id: p.id,
        name: p.name,
        score: correct * cfg.pointsPerCorrect,
        timeMs: Math.round(30_000 + rng() * 70_000),
        me: false,
      };
    });
    if (done)
      rows.push({
        id: 'me',
        name: { ar: state.player?.name ?? '', en: state.player?.name ?? '' },
        score: done.score,
        timeMs: done.timeMs,
        me: true,
      });
    return rows.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs);
  }, [day, done, cfg.pointsPerCorrect, state.player?.name]);

  async function share() {
    if (!done) return;
    const cells = done.grid.map((ok) => (ok ? '🟩' : '🟥')).join('');
    const text = `${fill(d.mirror.shareText, { product: productName(locale), date: date(`${day}T12:00:00Z`), score: num(done.score) })}\n${cells}`;
    try {
      if (navigator.share) await navigator.share({ text });
      else await navigator.clipboard.writeText(text);
    } catch {
      // Cancelled.
    }
  }

  const q = questions[i];
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.mirror.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/play')}>
          {d.common.back}
        </Button>
      </div>

      {phase === 'ready' && !done && (
        <Card>
          <p className="text-muted">{d.mirror.intro}</p>
          <p className="mt-2 text-sm font-semibold text-violet">+{ENG.xp.mirror} XP</p>
          <Button
            className="mt-4 w-full"
            size="lg"
            onClick={() => {
              setPhase('run');
              setI(0);
              setGrid([]);
              setTimeMs(0);
              shownAt.current = performance.now();
            }}
            disabled={!questions.length}
          >
            {d.mirror.start}
          </Button>
        </Card>
      )}

      {phase === 'run' && q && (
        <Card>
          <div className="mb-3 flex items-center justify-between text-sm text-muted">
            <span>{fill(d.match.questionOf, { i: num(i + 1), n: num(questions.length) })}</span>
            <span className="tabular font-bold text-ink">
              {num(Math.max(0, Math.ceil((limitMs - elapsed) / 1000)))} {d.common.sec}
            </span>
          </div>
          <div className="mb-3 flex gap-1">
            {questions.map((qq, k) => (
              <span
                key={qq.id}
                className={`h-1.5 flex-1 rounded-full ${k < grid.length ? (grid[k] ? 'bg-ok' : 'bg-bad') : k === i ? 'bg-violet' : 'bg-slate-200'}`}
              />
            ))}
          </div>
          <QuestionImage id={q.image} className="mb-3" />
          <h2 className="mb-4 text-lg font-bold leading-relaxed">{pick(q.text)}</h2>
          <div className="grid gap-2.5">
            {(orders[i] ?? []).map((opt, pos) => {
              let cls = 'border-line bg-white hover:border-violet';
              if (flash !== null)
                cls =
                  opt === 0
                    ? 'border-ok bg-ok-bg'
                    : flash === opt
                      ? 'border-bad bg-bad-bg'
                      : 'border-line opacity-60';
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
                  <bdi>{pick(q.options[opt] as BiText)}</bdi>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {done && phase === 'ready' && (
        <Card className="text-center">
          <p className="text-sm font-semibold text-muted">{d.mirror.done}</p>
          <p className="tabular my-2 text-5xl font-black text-violet">{num(done.score)}</p>
          <div className="mx-auto mb-3 flex w-fit gap-1" aria-label={d.mirror.grid}>
            {done.grid.map((ok, k) => (
              <span key={k} className={`h-5 w-5 rounded ${ok ? 'bg-ok' : 'bg-bad'}`} />
            ))}
          </div>
          <Button variant="secondary" onClick={share}>
            {d.result.share}
          </Button>
          <p className="mt-3 text-xs text-muted">{d.mirror.onePerDay}</p>
        </Card>
      )}

      <Card title={d.mirror.board} className="p-0 sm:p-0">
        <ol className="divide-y divide-line">
          {board.slice(0, 15).map((r, k) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 px-4 py-2.5 ${r.me ? 'bg-violet-bg' : ''}`}
            >
              <span className="tabular w-6 text-sm font-bold text-muted">{num(k + 1)}</span>
              <span className="flex-1 truncate font-medium">
                {pick(r.name)} {r.me && <Badge tone="violet">{d.lb.you}</Badge>}
              </span>
              <span className="tabular text-xs text-muted">
                {num(r.timeMs / 1000, 1)} {d.common.sec}
              </span>
              <span className="tabular w-10 text-end font-bold">{num(r.score)}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
