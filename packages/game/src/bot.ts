import type { GameConfig } from './config.js';
import type { Rng } from './rng.js';
import type { Difficulty } from './selection.js';

const BASE_ACCURACY: Record<Difficulty, number> = { easy: 0.85, medium: 0.65, hard: 0.45 };

/**
 * A practice or sample opponent's answer to one question. Accuracy rises with rating; answers always take longer
 * than the fair-play floor, so a bot never looks inhuman. Returns the time to answer and whether it is correct.
 */
export function botAnswer(
  rating: number,
  difficulty: Difficulty,
  cfg: GameConfig,
  rng: Rng,
): { latencyMs: number | null; correct: boolean } {
  const skill = Math.max(-0.2, Math.min(0.2, (rating - cfg.rating.start) / 1500));
  const accuracy = Math.max(0.1, Math.min(0.97, BASE_ACCURACY[difficulty] + skill));
  const limitMs = cfg.questionSeconds * 1000;
  // A few timeouts on hard questions.
  if (difficulty === 'hard' && rng() < 0.08) return { latencyMs: null, correct: false };
  const floor = cfg.fairPlay.minHumanMs + 700;
  const latencyMs = Math.round(floor + rng() ** 1.6 * (limitMs * 0.7 - floor));
  return { latencyMs, correct: rng() < accuracy };
}
