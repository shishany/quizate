import { toMonthlyScale } from './sample';
import {
  inhumanSpeedFlag,
  matchScore,
  monthlyPoints,
  outcomeFor,
  isOn,
  matchSponsorEvents,
  monthlyRating,
  riyadhMonthKey,
  correctCount,
  totalAnswerMs,
  rankedXp,
  updateRatings,
  type AnswerRecord,
  type DistanceBand,
  type RankedResult,
} from '@quizate/game';
import { ENG, xpGrant } from './engagement';
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
  opponent: {
    id: string;
    name: BiText;
    cityId: string;
    band: DistanceBand | null;
    rating: number;
    /** Ghost (recorded) opponent: no rating, points, qualification or prizes unless `ghost_counts_for_rating`. */
    ghost?: boolean;
    /** Challenge-a-friend match: counts for no rating, qualification, points or prizes. */
    friend?: boolean;
  };
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
  const outcome = m.forfeit
    ? 'loss'
    : outcomeFor(myScore, theirScore, totalAnswerMs(m.mine, cfg), totalAnswerMs(m.theirs, cfg));
  const ranked = m.mode === 'ranked';
  // CR v3 section 6: the rating that counts is this month's, starting at 1,000.
  const ratingBefore = ranked
    ? monthlyRating(state.myResults, riyadhMonthKey(m.at), cfg).rating
    : (state.player?.rating ?? cfg.rating.start);
  const opponentRating = toMonthlyScale(m.opponent.rating, cfg);

  const counted = ranked && countedThisMonth(state, m.at) < cfg.monthlyCap;
  const points = counted && m.opponent.ghost !== true ? monthlyPoints(outcome, myScore, cfg) : 0;
  // Ghost matches change no rating and earn no points while ghost answers are generated (owner, 15 Nov 2026).
  const ghostCounts = m.opponent.ghost !== true || isOn('ghost_counts_for_rating');
  const ratingAfter = ranked && ghostCounts
    ? updateRatings(ratingBefore, opponentRating, outcome, cfg).a
    : ratingBefore;
  const answered = m.mine.filter((a) => a.latencyMs !== null);
  // FR-30: XP for completed matches only; it never touches monthly points (architecture rule 10).
  const xp = m.forfeit
    ? null
    : ranked
      ? xpGrant(
          state,
          'ranked',
          rankedXp(correctCount(m.mine), outcome === 'win', ENG),
          m.at,
          m.id,
        )
      : xpGrant(state, 'practice', ENG.xp.practice, m.at, m.id);

  const summary: MatchSummary = {
    id: m.id,
    mode: m.mode,
    at: m.at,
    opponent: m.opponent,
    myScore,
    opponentScore: theirScore,
    outcome,
    correct: correctCount(m.mine),
    questions: m.questions.length,
    monthlyPoints: points,
    counted,
    ratingBefore,
    ratingAfter,
    forfeit: m.forfeit,
    xp: xp?.amount ?? 0,
  };

  const result: RankedResult | undefined = ranked
    ? {
        matchId: m.id,
        at: m.at,
        opponentId: m.opponent.id,
        outcome,
        score: myScore,
        correct: correctCount(m.mine),
        opponentRating,
        ghost: m.opponent.ghost === true,
        friend: m.opponent.friend === true,
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
    xp,
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
    // CR v3 section 8: one batch of view/answer events per match, appended to the events table.
    sponsorEvents: matchSponsorEvents(m.questions, m.mine, m.at, cfg),
    sponsored: sponsoredIdx.length
      ? {
          shown: sponsoredIdx.length,
          answered: sponsoredIdx.filter((i) => m.mine[i]?.latencyMs !== null).length,
          correct: sponsoredIdx.filter((i) => m.mine[i]?.correct).length,
        }
      : undefined,
  };
}
