import type { GameConfig } from './config.js';
import { shuffle, type Rng } from './rng.js';
import { DAY_MS } from './time.js';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface SelectableQuestion {
  id: string;
  difficulty: Difficulty;
  status: 'draft' | 'in_review' | 'published' | 'retired';
  /** UTC ISO, or null for no expiry. */
  expiresAt: string | null;
  /** Set when the question belongs to a sponsor campaign that is live. */
  sponsored: boolean;
}

export type SelectionResult<Q> =
  { ok: true; questions: Q[] } | { ok: false; reason: 'NOT_ENOUGH_QUESTIONS' };

/**
 * Picks one fixed question set for a match:
 * - published and not expired;
 * - BR-13: none seen by either player in the last N days (`seen` maps question id → last time seen, UTC ISO);
 * - difficulty mix from configuration (build prompt 4);
 * - BR-14: at most N sponsored questions.
 * Set `enforceRepeatRule: false` for unranked modes (see docs/DEMO.md).
 */
export function selectQuestions<Q extends SelectableQuestion>(
  bank: readonly Q[],
  seen: ReadonlyMap<string, string>,
  now: Date,
  cfg: GameConfig,
  rng: Rng,
  {
    enforceRepeatRule = true,
    count = cfg.questionsPerMatch,
  }: { enforceRepeatRule?: boolean; count?: number } = {},
): SelectionResult<Q> {
  const cutoff = now.getTime() - cfg.questionRepeatDays * DAY_MS;
  const available = bank.filter((q) => {
    if (q.status !== 'published') return false;
    if (q.expiresAt && new Date(q.expiresAt).getTime() <= now.getTime()) return false;
    const last = seen.get(q.id);
    return !enforceRepeatRule || !last || new Date(last).getTime() < cutoff;
  });

  const mix = cfg.difficultyMix;
  const totalMix = mix.easy + mix.medium + mix.hard;
  const want: Record<Difficulty, number> = {
    easy: Math.round((mix.easy / totalMix) * count),
    medium: 0,
    hard: Math.round((mix.hard / totalMix) * count),
  };
  want.medium = count - want.easy - want.hard;

  let sponsoredLeft = cfg.maxSponsored;
  const picked: Q[] = [];
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const pool = shuffle(
      available.filter((q) => q.difficulty === difficulty),
      rng,
    );
    for (const q of pool) {
      if (picked.filter((p) => p.difficulty === difficulty).length >= want[difficulty]) break;
      if (q.sponsored) {
        if (sponsoredLeft <= 0) continue;
        sponsoredLeft--;
      }
      picked.push(q);
    }
  }
  if (picked.length < count) return { ok: false, reason: 'NOT_ENOUGH_QUESTIONS' };
  return { ok: true, questions: shuffle(picked, rng) };
}
