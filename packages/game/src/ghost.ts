/**
 * Ghost opponent and friend challenges (Sabbaq change request v3, section 7).
 * A ghost opponent replays a stored real match of similar rating. While ghost answers are generated its matches count
 * for no rating, qualification or prizes (flag `ghost_counts_for_rating`, off); never for the
 * 60-match qualification (`RankedResult.ghost`). The UI labels it "منافس مسجّل" (recorded opponent).
 */
import type { GameConfig } from './config.js';
import type { Rng } from './rng.js';

export const ghostDue = (waitSeconds: number, cfg: GameConfig): boolean => waitSeconds >= cfg.ghostAfterSeconds;

export interface Recording {
  id: string;
  /** The recorded player's monthly rating when the match was played. */
  rating: number;
}

/** The stored match whose player rating is closest to `rating`; null if none is stored. */
export function pickGhost<R extends Recording>(recordings: readonly R[], rating: number): R | null {
  let best: R | null = null;
  for (const r of recordings) {
    if (!best || Math.abs(r.rating - rating) < Math.abs(best.rating - rating)) best = r;
  }
  return best;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Code for a private "challenge a friend" match; shared as a link. */
export function inviteCode(rng: Rng, length = 6): string {
  return Array.from({ length }, () => ALPHABET[Math.floor(rng() * ALPHABET.length)]).join('');
}

export const isInviteCode = (code: string): boolean => /^[A-HJ-NP-Z2-9]{6}$/.test(code);
