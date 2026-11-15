import type { GameConfig } from './config.js';

export interface AnswerRecord {
  /** Option chosen, or null when the timer ran out. */
  option: number | null;
  correct: boolean;
  /** Server-measured time from question shown to answer received; null on timeout. */
  latencyMs: number | null;
}

export type Outcome = 'win' | 'loss' | 'draw';

/** Sabbaq CR v3 section 5: points for one answer, from the server-measured time. Wrong or timeout = 0. */
export function answerPoints(a: AnswerRecord, cfg: GameConfig): number {
  if (!a.correct || a.latencyMs === null) return 0;
  const { base, perSecond, min } = cfg.speedPoints;
  const raw = Math.round(base - perSecond * (a.latencyMs / 1000));
  return Math.min(cfg.pointsPerCorrect, Math.max(min, raw));
}

/** Match score: sum of answer points (max questionsPerMatch x pointsPerCorrect = 100). */
export function matchScore(answers: readonly AnswerRecord[], cfg: GameConfig): number {
  return answers.reduce((sum, a) => sum + answerPoints(a, cfg), 0);
}

export const correctCount = (answers: readonly AnswerRecord[]): number => answers.filter((a) => a.correct).length;

/** Total answer time; a timeout counts as the full question time. Used for the tie-break. */
export function totalAnswerMs(answers: readonly AnswerRecord[], cfg: GameConfig): number {
  return answers.reduce((sum, a) => sum + (a.latencyMs ?? cfg.questionSeconds * 1000), 0);
}

/**
 * Sabbaq CR v3 section 5: higher points wins; on equal points the lower total answer time wins; a draw only when
 * both are equal (or no times are given).
 */
export function outcomeFor(
  ownScore: number,
  opponentScore: number,
  ownTotalMs?: number,
  opponentTotalMs?: number,
): Outcome {
  if (ownScore > opponentScore) return 'win';
  if (ownScore < opponentScore) return 'loss';
  if (ownTotalMs !== undefined && opponentTotalMs !== undefined && ownTotalMs !== opponentTotalMs) {
    return ownTotalMs < opponentTotalMs ? 'win' : 'loss';
  }
  return 'draw';
}

/** BR-02: response time is kept for tie-breaks only. Average over answered questions; null if none answered. */
export function averageLatencyMs(answers: readonly AnswerRecord[]): number | null {
  const timed = answers.filter((a) => a.latencyMs !== null).map((a) => a.latencyMs as number);
  return timed.length ? Math.round(timed.reduce((s, x) => s + x, 0) / timed.length) : null;
}
