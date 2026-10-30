import { DAY_MS, riyadhDayKey } from './time.js';

/**
 * Engagement layer (BRD FR-30, docs/ENGAGEMENT.md). Values marked "ENGAGEMENT.md" come from the design; values marked
 * "sample" are not given there and are placeholders for the owner to set. Nothing here changes monthly ranked points
 * (architecture rule 10).
 */
export interface LadderTier {
  id: string;
  name: { ar: string; en: string; ur: string };
  /** Monthly points needed to enter; null for the rank-based top tier. */
  entry: number | null;
}

export interface EngagementConfig {
  xp: {
    /** ENGAGEMENT.md section 3 */
    rankedBase: number;
    perCorrect: number;
    winBonus: number;
    practice: number;
    practiceDailyCap: number;
    mirror: number;
    /** Missions, events, question of the day: combined daily cap. */
    bonusDailyCap: number;
    /** "small XP" in ENGAGEMENT.md; sample value */
    questionOfDay: number;
  };
  /** ENGAGEMENT.md: level n needs 100 × n XP, levels 1–100, never reset. */
  levels: { perLevel: number; max: number };
  ladder: { tiers: LadderTier[]; divisions: number; eliteTopRank: number; topTierSpan: number };
  /** Day 1–7 rewards; sample values (ENGAGEMENT.md gives the shape, not the amounts). */
  claim: { coins: number; xp: number; cosmetic: string | null }[];
  /** ENGAGEMENT.md section 4: a shield is earned at these streak lengths. */
  streakShieldsAt: number[];
  missionsPerDay: number;
}

export const DEFAULT_ENGAGEMENT: EngagementConfig = {
  xp: {
    rankedBase: 20,
    perCorrect: 2,
    winBonus: 15,
    practice: 10,
    practiceDailyCap: 200,
    mirror: 30,
    bonusDailyCap: 300,
    questionOfDay: 5,
  },
  levels: { perLevel: 100, max: 100 },
  ladder: {
    divisions: 3,
    eliteTopRank: 100,
    topTierSpan: 1000,
    tiers: [
      { id: 'beginner', name: { ar: 'مبتدئ', en: 'Beginner', ur: 'نوآموز' }, entry: 0 },
      { id: 'reader', name: { ar: 'قارئ', en: 'Reader', ur: 'قاری' }, entry: 300 },
      { id: 'cultured', name: { ar: 'مثقف', en: 'Well-read', ur: 'باشعور' }, entry: 800 },
      { id: 'capable', name: { ar: 'متمكن', en: 'Adept', ur: 'ماہر' }, entry: 1500 },
      { id: 'expert', name: { ar: 'خبير', en: 'Expert', ur: 'ماہرِ خاص' }, entry: 2500 },
      { id: 'scholar', name: { ar: 'عالِم', en: 'Scholar', ur: 'عالم' }, entry: 3500 },
      { id: 'sage', name: { ar: 'حكيم', en: 'Sage', ur: 'حکیم' }, entry: 4500 },
      { id: 'elite', name: { ar: 'نخبة', en: 'Elite', ur: 'اشرافیہ' }, entry: null },
    ],
  },
  claim: [
    { coins: 10, xp: 10, cosmetic: null },
    { coins: 15, xp: 10, cosmetic: null },
    { coins: 20, xp: 15, cosmetic: null },
    { coins: 25, xp: 15, cosmetic: null },
    { coins: 30, xp: 20, cosmetic: null },
    { coins: 40, xp: 20, cosmetic: null },
    { coins: 60, xp: 30, cosmetic: 'frame-week' },
  ],
  streakShieldsAt: [7, 30],
  missionsPerDay: 3,
};

/** XP for one ranked match (ENGAGEMENT.md section 3). */
export function rankedXp(correct: number, won: boolean, cfg: EngagementConfig): number {
  return cfg.xp.rankedBase + cfg.xp.perCorrect * correct + (won ? cfg.xp.winBonus : 0);
}

/** Grants up to the cap: what is left today, never negative. */
export function capped(amount: number, alreadyToday: number, cap: number): number {
  return Math.max(0, Math.min(amount, cap - alreadyToday));
}

/**
 * Level from total XP. Going from level n to n+1 takes perLevel × n XP, so level 2 needs 100 in total, level 3 needs
 * 300, level 4 needs 600 (our reading of "level n requires 100 × n XP (cumulative)").
 */
export function levelFor(
  totalXp: number,
  cfg: EngagementConfig,
): { level: number; into: number; need: number } {
  let level = 1;
  let floor = 0;
  while (level < cfg.levels.max && totalXp >= floor + cfg.levels.perLevel * level) {
    floor += cfg.levels.perLevel * level;
    level += 1;
  }
  const need = level >= cfg.levels.max ? 0 : cfg.levels.perLevel * level;
  return { level, into: totalXp - floor, need };
}

export interface LadderPosition {
  tierIndex: number;
  /** 3 = lowest division of the tier, 1 = highest; 0 for the rank-based top tier. */
  division: number;
  /** Points at which the next division or tier starts; null at the top. */
  nextAt: number | null;
  /** Progress through the current division, 0–1. */
  progress: number;
}

/**
 * The monthly ladder, derived from BR-04 monthly points. The top tier is rank-based: the top N by rank among players
 * who have reached the highest points tier (our reading of "Top 100: rank-based", so a small field cannot make
 * everyone elite).
 */
export function ladderFor(
  points: number,
  rank: number | null,
  cfg: EngagementConfig,
): LadderPosition {
  const tiers = cfg.ladder.tiers;
  const eliteIndex = tiers.findIndex((t) => t.entry === null);
  const highestEntry = Math.max(...tiers.map((t) => t.entry ?? 0));
  if (
    eliteIndex >= 0 &&
    rank !== null &&
    rank <= cfg.ladder.eliteTopRank &&
    points >= highestEntry
  ) {
    return { tierIndex: eliteIndex, division: 0, nextAt: null, progress: 1 };
  }
  const numeric = tiers.map((t, i) => ({ t, i })).filter(({ t }) => t.entry !== null);
  let current = numeric[0] as { t: LadderTier; i: number };
  for (const n of numeric) if (points >= (n.t.entry as number)) current = n;
  const start = current.t.entry as number;
  const nextTier = numeric.find((n) => (n.t.entry as number) > start);
  const end = nextTier ? (nextTier.t.entry as number) : start + cfg.ladder.topTierSpan;
  const step = (end - start) / cfg.ladder.divisions;
  const done = Math.min(cfg.ladder.divisions - 1, Math.floor((points - start) / step));
  const divStart = start + done * step;
  return {
    tierIndex: current.i,
    division: cfg.ladder.divisions - done,
    nextAt: nextTier || done < cfg.ladder.divisions - 1 ? Math.round(divStart + step) : null,
    progress: Math.min(1, (points - divStart) / step),
  };
}

/**
 * Streak (ENGAGEMENT.md section 4): consecutive Riyadh days with at least one completed match or Mirror Challenge.
 * Shields are earned when the streak reaches 7 and 30 days; each protects one missed day.
 */
export function streakFor(
  activeDays: readonly string[],
  today: string,
  cfg: EngagementConfig,
): { days: number; shields: number } {
  const days = [...new Set(activeDays)].sort();
  let streak = 0;
  let shields = 0;
  let prev: number | null = null;
  for (const d of days) {
    const t = Date.parse(`${d}T00:00:00Z`);
    const gap = prev === null ? 1 : Math.round((t - prev) / DAY_MS);
    if (gap === 1) streak += 1;
    else if (gap === 2 && shields > 0) {
      shields -= 1;
      streak += 1;
    } else streak = 1;
    if (cfg.streakShieldsAt.includes(streak)) shields += 1;
    prev = t;
  }
  if (prev === null) return { days: 0, shields: 0 };
  const sinceLast = Math.round((Date.parse(`${today}T00:00:00Z`) - prev) / DAY_MS);
  if (sinceLast <= 1) return { days: streak, shields };
  if (sinceLast === 2 && shields > 0) return { days: streak, shields: shields - 1 };
  return { days: 0, shields: 0 };
}

/**
 * Daily claim (ENGAGEMENT.md section 4): a 7-day calendar. Claiming on consecutive days moves along it; missing a day
 * restarts the calendar (not the streak).
 */
export function claimState(
  lastClaim: { day: string; index: number } | null,
  today: string,
  cfg: EngagementConfig,
): { claimable: boolean; index: number } {
  const len = cfg.claim.length;
  if (!lastClaim) return { claimable: true, index: 0 };
  if (lastClaim.day === today) return { claimable: false, index: lastClaim.index };
  const gap = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastClaim.day}T00:00:00Z`)) / DAY_MS,
  );
  return { claimable: true, index: gap === 1 ? (lastClaim.index + 1) % len : 0 };
}

/** A number that is the same for every player on one Riyadh day (Mirror Challenge, question of the day, missions). */
export function daySeed(at: Date | string, salt = 0): number {
  const key = riyadhDayKey(at).replaceAll('-', '');
  return (Number(key) * 31 + salt) % 2_147_483_647;
}
