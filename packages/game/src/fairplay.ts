import type { GameConfig } from './config.js';
import type { AnswerRecord } from './scoring.js';

/** BRD section 3: answers faster than a human could read the question, more than the allowed number of times. */
export function inhumanSpeedFlag(answers: readonly AnswerRecord[], cfg: GameConfig): boolean {
  const fast = answers.filter(
    (a) => a.latencyMs !== null && a.latencyMs < cfg.fairPlay.minHumanMs,
  ).length;
  return fast > cfg.fairPlay.maxFastAnswers;
}
