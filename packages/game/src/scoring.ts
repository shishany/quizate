import type { GameConfig } from './config.js';

export interface AnswerRecord {
  /** Option chosen, or null when the timer ran out. */
  option: number | null;
  correct: boolean;
  /** Server-measured time from question shown to answer received; null on timeout. */
  latencyMs: number | null;
}

export type Outcome = 'win' | 'loss' | 'draw';

/** BR-01: points per correct answer, 0 for wrong or timeout. BR-02: speed adds nothing to the score. */
export function matchScore(answers: readonly AnswerRecord[], cfg: GameConfig): number {
  return answers.filter((a) => a.correct).length * cfg.pointsPerCorrect;
}

/** BR-03: higher score wins; equal scores draw. */
export function outcomeFor(ownScore: number, opponentScore: number): Outcome {
  if (ownScore > opponentScore) return 'win';
  if (ownScore < opponentScore) return 'loss';
  return 'draw';
}

/** BR-02: response time is kept for tie-breaks only. Average over answered questions; null if none answered. */
export function averageLatencyMs(answers: readonly AnswerRecord[]): number | null {
  const timed = answers.filter((a) => a.latencyMs !== null).map((a) => a.latencyMs as number);
  return timed.length ? Math.round(timed.reduce((s, x) => s + x, 0) / timed.length) : null;
}
