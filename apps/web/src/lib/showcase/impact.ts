/** Association impact figures for /showcase/impact, read from the live simulation (demo data). */
import type { MatchCategoryId } from '@quizate/game';
import type { SimState } from './sim';

export interface Impact {
  questionsAnswered: number;
  playersReached: number;
  cities: number;
  /** Players aged 13-17, at the simulated share of youth players. */
  youthEngaged: number;
  /** Category share of today's matches, largest first; Mixed is left out (it spans all of them). */
  byCategory: { id: MatchCategoryId; matches: number; share: number }[];
}

export function impactOf(sim: SimState): Impact {
  const youthShare = sim.players.filter((p) => p.youth).length / Math.max(1, sim.players.length);
  const entries = (Object.entries(sim.byCategory) as [MatchCategoryId, number][]).filter(
    ([id]) => id !== 'mixed',
  );
  const total = entries.reduce((t, [, n]) => t + n, 0);
  return {
    questionsAnswered: sim.counters.questionsAnswered,
    playersReached: sim.counters.playersToday,
    cities: new Set(sim.players.map((p) => p.cityId)).size,
    youthEngaged: Math.round(sim.counters.playersToday * youthShare),
    byCategory: entries
      .map(([id, matches]) => ({ id, matches, share: total ? matches / total : 0 }))
      .sort((a, b) => b.matches - a.matches),
  };
}
