import type { GameConfig } from './config.js';
import type { Outcome } from './scoring.js';

const SCORE: Record<Outcome, number> = { win: 1, draw: 0.5, loss: 0 };

/** BR-09: Elo-type rating update for both players; used by matchmaking only. Ratings are whole numbers. */
export function updateRatings(
  ratingA: number,
  ratingB: number,
  outcomeA: Outcome,
  cfg: GameConfig,
): { a: number; b: number } {
  const expectedA = 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
  const delta = cfg.rating.k * (SCORE[outcomeA] - expectedA);
  return { a: Math.round(ratingA + delta), b: Math.round(ratingB - delta) };
}
