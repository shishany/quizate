import {
  inhumanSpeedFlag,
  matchScore,
  monthlyPoints,
  outcomeFor,
  updateRatings,
  type AnswerRecord,
  type DistanceBand,
  type RankedResult,
} from '@quizate/game';
import type { Action } from './store';
import { countedThisMonth } from './store';
import type { DemoState, MatchSummary, Question } from './types';
import type { BiText } from '@/data/questions';

export interface SettleInput {
  id: string;
  mode: 'ranked' | 'practice';
  at: string;
  questions: Question[];
  mine: AnswerRecord[];
  theirs: AnswerRecord[];
  forfeit: boolean;
  opponent: { id: string; name: BiText; cityId: string; band: DistanceBand | null; rating: number };
}

/**
 * Turns a finished match into the store action that records it. Ranked: BR-01 score, BR-03 outcome (a forfeit is a
 * loss, BR-11), BR-04 monthly points within the BR-05 cap, BR-09 rating. Practice changes neither points nor rating.
 */
export function settle(
  state: DemoState,
  m: SettleInput,
): Extract<Action, { type: 'matchFinished' }> {
  const cfg = state.config;
  const myScore = matchScore(m.mine, cfg);
  const theirScore = matchScore(m.theirs, cfg);
  const outcome = m.forfeit ? 'loss' : outcomeFor(myScore, theirScore);
  const ratingBefore = state.player?.rating ?? cfg.rating.start;
  const ranked = m.mode === 'ranked';

  const counted = ranked && countedThisMonth(state, m.at) < cfg.monthlyCap;
  const points = counted ? monthlyPoints(outcome, myScore, cfg) : 0;
  const ratingAfter = ranked
    ? updateRatings(ratingBefore, m.opponent.rating, outcome, cfg).a
    : ratingBefore;
  const answered = m.mine.filter((a) => a.latencyMs !== null);

  const summary: MatchSummary = {
    id: m.id,
    mode: m.mode,
    at: m.at,
    opponent: m.opponent,
    myScore,
    opponentScore: theirScore,
    outcome,
    correct: myScore / cfg.pointsPerCorrect,
    questions: m.questions.length,
    monthlyPoints: points,
    counted,
    ratingBefore,
    ratingAfter,
    forfeit: m.forfeit,
  };

  const result: RankedResult | undefined = ranked
    ? {
        matchId: m.id,
        at: m.at,
        opponentId: m.opponent.id,
        outcome,
        score: myScore,
        correct: myScore / cfg.pointsPerCorrect,
        questions: m.questions.length,
        latencyTotalMs: answered.reduce((s, a) => s + (a.latencyMs ?? 0), 0),
        answered: answered.length,
      }
    : undefined;

  const sponsoredIdx = m.questions.map((q, i) => (q.sponsored ? i : -1)).filter((i) => i >= 0);
  return {
    type: 'matchFinished',
    summary,
    ranked: result,
    seenIds: ranked ? m.questions.map((q) => q.id) : [],
    abandoned: ranked && m.forfeit,
    flag:
      ranked && inhumanSpeedFlag(m.mine, cfg)
        ? {
            evidence: {
              ar: 'إجابات أسرع من الحد البشري في مباراة مصنّفة',
              en: 'Answers faster than the human floor in a ranked match',
            },
          }
        : undefined,
    sponsored: sponsoredIdx.length
      ? {
          shown: sponsoredIdx.length,
          answered: sponsoredIdx.filter((i) => m.mine[i]?.latencyMs !== null).length,
          correct: sponsoredIdx.filter((i) => m.mine[i]?.correct).length,
        }
      : undefined,
  };
}
