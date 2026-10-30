import type { GameConfig, MatchmakingStep } from './config.js';

export type DistanceBand = 'under10' | 'from10to50' | 'sameCity' | 'saudi';

/** BRD section 4: the search rule in force after waiting this long. */
export function searchStep(
  waitSeconds: number,
  cfg: GameConfig,
): { index: number; step: MatchmakingStep } {
  let index = 0;
  cfg.matchmaking.forEach((s, i) => {
    if (waitSeconds >= s.fromSeconds) index = i;
  });
  return { index, step: cfg.matchmaking[index] as MatchmakingStep };
}

/** Rounds coordinates to two decimals (about 1.1 km) before anything stores them (architecture rule 7). */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Great-circle distance in km. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** What the opponent is shown: a band, never coordinates or an exact distance (BRD section 4). */
export function distanceBand(km: number | null, sameCity: boolean): DistanceBand {
  if (km !== null && km < 10) return 'under10';
  if (km !== null && km <= 50) return 'from10to50';
  return sameCity ? 'sameCity' : 'saudi';
}

export interface QueueEntry {
  id: string;
  rating: number;
  cityId: string;
  /** Rounded coordinates, only while the ticket is open and only with location consent. */
  location: { lat: number; lng: number } | null;
}

/**
 * Finds the best opponent for `me` under the rule for the current wait. Candidates must already have passed the
 * eligibility checks (limits, suspensions, devices). Closest rating wins; distance breaks ties.
 */
export function findOpponent(
  me: QueueEntry,
  candidates: readonly QueueEntry[],
  waitSeconds: number,
  cfg: GameConfig,
): { opponent: QueueEntry; band: DistanceBand } | null {
  const { step } = searchStep(waitSeconds, cfg);
  if (step.offerPractice && !candidates.length) return null;

  const scored = candidates
    .filter((c) => c.id !== me.id)
    .map((c) => {
      const km = me.location && c.location ? distanceKm(me.location, c.location) : null;
      return { c, km, sameCity: c.cityId === me.cityId };
    })
    .filter(({ c, km, sameCity }) => {
      if (step.ratingBand !== null && Math.abs(c.rating - me.rating) > step.ratingBand)
        return false;
      if (step.maxKm !== null) return km !== null && km <= step.maxKm;
      if (step.sameCity) return sameCity;
      return true;
    })
    .sort(
      (x, y) =>
        Math.abs(x.c.rating - me.rating) - Math.abs(y.c.rating - me.rating) ||
        (x.km ?? 1e9) - (y.km ?? 1e9),
    );

  const best = scored[0];
  return best ? { opponent: best.c, band: distanceBand(best.km, best.sameCity) } : null;
}
