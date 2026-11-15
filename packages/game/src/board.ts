/**
 * Leaderboard badges (Sabbaq change request v3, section 6). Everyone ranks together; badges only mark who is in a
 * prize zone. Rows must already be in rank order.
 */
export interface BadgeInput {
  playerId: string;
  /** Qualified this month (>= 60 completed non-ghost matches). */
  eligible: boolean;
  /** age >= 18 AND id_verified. */
  cashEligible: boolean;
  ageGroup: 'youth' | 'adult';
  /** Completed qualifying matches this month (youth qualify at `youthMinMatches`). */
  qualifyingMatches: number;
}

export interface Badges {
  /** 1-10 among qualified cash-eligible players, else null. */
  prizeZone: number | null;
  /** 1-N among youth players with at least `youthMinMatches` matches, else null. */
  youthTop: number | null;
}

export function boardBadges(
  rows: readonly BadgeInput[],
  prizeSlots: number,
  youthSlots: number,
  youthMinMatches: number,
): Map<string, Badges> {
  let prize = 0;
  let youth = 0;
  const out = new Map<string, Badges>();
  for (const r of rows) {
    const prizeZone = r.eligible && r.cashEligible && prize < prizeSlots ? ++prize : null;
    const youthTop =
      r.ageGroup === 'youth' && r.qualifyingMatches >= youthMinMatches && youth < youthSlots ? ++youth : null;
    out.set(r.playerId, { prizeZone, youthTop });
  }
  return out;
}
