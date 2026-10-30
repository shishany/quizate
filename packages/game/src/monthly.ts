import type { GameConfig } from './config.js';
import type { Outcome } from './scoring.js';
import { riyadhMonthKey } from './time.js';

/**
 * BR-04: monthly points from one ranked match, as a share of the player's own match score. Not rounded: the BRD
 * gives no rounding rule, so a loser's 25% of 70 stays 17.5.
 */
export function monthlyPoints(outcome: Outcome, ownScore: number, cfg: GameConfig): number {
  return ownScore * cfg.monthlyShare[outcome];
}

/** One completed ranked match from one player's point of view. */
export interface RankedResult {
  matchId: string;
  /** Completion time, UTC ISO. */
  at: string;
  opponentId: string;
  outcome: Outcome;
  score: number;
  correct: number;
  questions: number;
  /** Sum of server-measured latencies over answered questions, and how many were answered. */
  latencyTotalMs: number;
  answered: number;
}

export interface Standing {
  playerId: string;
  month: string;
  points: number;
  /** BR-05: matches that counted (first N of the month). */
  counted: number;
  /** Ranked matches played this month, counted or not. */
  played: number;
  distinctOpponents: number;
  /** 0-1, over counted matches. */
  accuracy: number;
  /** Over answered questions in counted matches; Infinity when nothing was answered. */
  avgLatencyMs: number;
  /** When the final points total was reached (UTC ISO), or null with no points. */
  reachedAt: string | null;
  /** BR-08 */
  eligible: boolean;
}

/** BR-05, BR-08: builds a player's standing for one Riyadh month from their ranked results. */
export function standingFor(
  playerId: string,
  results: readonly RankedResult[],
  month: string,
  cfg: GameConfig,
): Standing {
  const inMonth = results
    .filter((r) => riyadhMonthKey(r.at) === month)
    .sort((a, b) => a.at.localeCompare(b.at));
  const counted = inMonth.slice(0, cfg.monthlyCap);

  let points = 0;
  let reachedAt: string | null = null;
  let correct = 0;
  let questions = 0;
  let latency = 0;
  let answered = 0;
  for (const r of counted) {
    const earned = monthlyPoints(r.outcome, r.score, cfg);
    points += earned;
    if (earned > 0) reachedAt = r.at;
    correct += r.correct;
    questions += r.questions;
    latency += r.latencyTotalMs;
    answered += r.answered;
  }
  const distinctOpponents = new Set(counted.map((r) => r.opponentId)).size;

  return {
    playerId,
    month,
    points,
    counted: counted.length,
    played: inMonth.length,
    distinctOpponents,
    accuracy: questions ? correct / questions : 0,
    avgLatencyMs: answered ? latency / answered : Infinity,
    reachedAt,
    eligible:
      counted.length >= cfg.eligibility.minMatches &&
      distinctOpponents >= cfg.eligibility.minOpponents,
  };
}

/**
 * BR-10: points desc, then accuracy desc, then average response time asc, then whoever reached their final points
 * first. Player id last, only so the order is stable.
 */
export function compareStandings(a: Standing, b: Standing): number {
  return (
    b.points - a.points ||
    b.accuracy - a.accuracy ||
    a.avgLatencyMs - b.avgLatencyMs ||
    (a.reachedAt ?? '￿').localeCompare(b.reachedAt ?? '￿') ||
    a.playerId.localeCompare(b.playerId)
  );
}

export interface RankedStanding extends Standing {
  rank: number;
  /** Rank among eligible players only (prize ranking, BR-08 and BR-17); null when not eligible. */
  prizeRank: number | null;
}

/** Orders standings (BR-10) and numbers them; ineligible players keep a rank but no prize rank (BR-17). */
export function rankStandings(standings: readonly Standing[]): RankedStanding[] {
  let prize = 0;
  return [...standings].sort(compareStandings).map((s, i) => ({
    ...s,
    rank: i + 1,
    prizeRank: s.eligible ? ++prize : null,
  }));
}
