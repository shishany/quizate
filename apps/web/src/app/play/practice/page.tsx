'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { seededRng, selectQuestions, type AnswerRecord } from '@quizate/game';
import { MatchPlayer, type MatchOutcome } from '@/components/player/MatchPlayer';
import { ResultView } from '@/components/player/ResultView';
import { Button, Card } from '@/components/ui';
import { DICTIONARIES, useT } from '@/i18n';
import { samplePlayerById } from '@/lib/sample';
import { settle } from '@/lib/settle';
import { useStore } from '@/lib/store';
import type { MatchSummary, Question } from '@/lib/types';
import type { BiText } from '@/data/questions';

type Level = 'easy' | 'medium' | 'hard';
const BOT_RATING: Record<Level, number> = { easy: 1000, medium: 1200, hard: 1450 };

interface Opp {
  id: string;
  name: BiText;
  rating: number;
  cityId: string;
}

type Phase =
  | { kind: 'choose' }
  | { kind: 'match'; seed: number; opp: Opp; questions: Question[] }
  | {
      kind: 'result';
      opp: Opp;
      summary: MatchSummary;
      questions: Question[];
      mine: AnswerRecord[];
    };

/** FR-09: practice is always free, unranked and never touches monthly points or rating. */
function Practice() {
  const { state, dispatch } = useStore();
  const { d, fill } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const rematch = samplePlayerById(params.get('opp') ?? '');
  const [level, setLevel] = useState<Level>('medium');
  const [phase, setPhase] = useState<Phase>({ kind: 'choose' });

  function start(opp: Opp) {
    const seed = Date.now() % 2_147_483_647;
    const picked = selectQuestions(
      state.questions,
      new Map(),
      new Date(),
      state.config,
      seededRng(seed),
      { enforceRepeatRule: false },
    );
    if (picked.ok) setPhase({ kind: 'match', seed, opp, questions: picked.questions });
  }

  function bot(l: Level): Opp {
    const name = (lc: 'ar' | 'en' | 'ur') =>
      fill(DICTIONARIES[lc].practice.bot, { level: DICTIONARIES[lc].practice[l] });
    return {
      id: `bot-${l}`,
      name: { ar: name('ar'), en: name('en'), ur: name('ur') },
      rating: BOT_RATING[l],
      cityId: state.player?.cityId ?? 'riyadh',
    };
  }

  function done(opp: Opp, questions: Question[], outcome: MatchOutcome) {
    const action = settle(state, {
      id: `p-${Date.now()}`,
      mode: 'practice',
      at: new Date().toISOString(),
      questions,
      mine: outcome.mine,
      theirs: outcome.theirs,
      forfeit: outcome.forfeit,
      opponent: { id: opp.id, name: opp.name, cityId: opp.cityId, band: null, rating: opp.rating },
    });
    dispatch(action);
    setPhase({ kind: 'result', opp, summary: action.summary, questions, mine: outcome.mine });
  }

  if (phase.kind === 'match') {
    return (
      <MatchPlayer
        seed={phase.seed}
        mode="practice"
        questions={phase.questions}
        opponent={{ ...phase.opp, bandLabel: null }}
        onDone={(o) => done(phase.opp, phase.questions, o)}
      />
    );
  }

  if (phase.kind === 'result') {
    return (
      <ResultView
        summary={phase.summary}
        questions={phase.questions}
        mine={phase.mine}
        onAgain={() => start(phase.opp)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.practice.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/play')}>
          {d.common.back}
        </Button>
      </div>
      <Card>
        {rematch ? (
          <Button
            className="w-full"
            size="lg"
            onClick={() =>
              start({
                id: rematch.id,
                name: rematch.name,
                rating: rematch.rating,
                cityId: rematch.cityId,
              })
            }
          >
            {d.result.rematch}
          </Button>
        ) : (
          <>
            <p className="mb-3 font-medium">{d.practice.choose}</p>
            <div
              role="radiogroup"
              aria-label={d.practice.choose}
              className="grid grid-cols-3 gap-2"
            >
              {(['easy', 'medium', 'hard'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={level === l}
                  onClick={() => setLevel(l)}
                  className={`rounded-xl border-2 px-3 py-3 font-semibold ${level === l ? 'border-brand bg-brand/10 text-brand-deep' : 'border-line bg-white'}`}
                >
                  {d.practice[l]}
                </button>
              ))}
            </div>
            <Button className="mt-4 w-full" size="lg" onClick={() => start(bot(level))}>
              {d.practice.start}
            </Button>
          </>
        )}
        <p className="mt-3 text-xs text-muted">{d.practice.note}</p>
      </Card>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}
