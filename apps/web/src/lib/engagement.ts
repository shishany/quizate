import {
  DEFAULT_ENGAGEMENT as ENG,
  capped,
  claimState,
  daySeed,
  ladderFor,
  levelFor,
  riyadhDayKey,
  riyadhMonthKey,
  seededRng,
  shuffle,
  streakFor,
  type EngagementConfig,
} from '@quizate/game';
import type { DemoState, LedgerEntry, XpSource } from './types';

export { ENG };

/** Division labels: III is the first division of a tier, I the last. */
export const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

/** Sources that share the combined bonus cap (ENGAGEMENT.md: missions, events, referrals). */
const BONUS: XpSource[] = ['mission', 'claim', 'qotd', 'road'];

const sumToday = (entries: LedgerEntry[], sources: XpSource[], day: string) =>
  entries
    .filter((e) => sources.includes(e.source) && riyadhDayKey(e.at) === day)
    .reduce((s, e) => s + e.amount, 0);

/** An XP grant after the daily caps of ENGAGEMENT.md section 3. Returns null when nothing is left today. */
export function xpGrant(
  state: Pick<DemoState, 'xp'>,
  source: XpSource,
  amount: number,
  at: string,
  ref?: string,
  cfg: EngagementConfig = ENG,
): LedgerEntry | null {
  const day = riyadhDayKey(at);
  let granted = amount;
  if (source === 'practice')
    granted = capped(amount, sumToday(state.xp, ['practice'], day), cfg.xp.practiceDailyCap);
  else if (BONUS.includes(source))
    granted = capped(amount, sumToday(state.xp, BONUS, day), cfg.xp.bonusDailyCap);
  return granted > 0 ? { at, source, amount: granted, ref } : null;
}

export const totalXp = (s: Pick<DemoState, 'xp'>) => s.xp.reduce((t, e) => t + e.amount, 0);
export const coinBalance = (s: Pick<DemoState, 'coins'>) =>
  s.coins.reduce((t, e) => t + e.amount, 0);

export interface Mission {
  id: string;
  target: number;
  xp: number;
  coins: number;
}

/** Mission pool; three a day, the same for everyone (sample rewards). */
export const MISSION_POOL: Mission[] = [
  { id: 'ranked3', target: 3, xp: 40, coins: 20 },
  { id: 'win1', target: 1, xp: 40, coins: 20 },
  { id: 'correct15', target: 15, xp: 30, coins: 15 },
  { id: 'mirror', target: 1, xp: 30, coins: 15 },
  { id: 'speed', target: 1, xp: 30, coins: 15 },
  { id: 'practice2', target: 2, xp: 30, coins: 15 },
  { id: 'score80', target: 1, xp: 50, coins: 25 },
];

export function missionsFor(day: string): Mission[] {
  return shuffle(MISSION_POOL, seededRng(daySeed(`${day}T12:00:00Z`, 7))).slice(
    0,
    ENG.missionsPerDay,
  );
}

export function missionProgress(state: DemoState, m: Mission, day: string): number {
  const today = state.matches.filter((x) => riyadhDayKey(x.at) === day);
  switch (m.id) {
    case 'ranked3':
      return today.filter((x) => x.mode === 'ranked').length;
    case 'win1':
      return today.filter((x) => x.mode === 'ranked' && x.outcome === 'win' && !x.forfeit).length;
    case 'correct15':
      return (
        today.reduce((s, x) => s + x.correct, 0) +
        (state.mirror[day]?.grid.filter(Boolean).length ?? 0)
      );
    case 'mirror':
      return state.mirror[day] ? 1 : 0;
    case 'speed':
      return today.filter((x) => x.mode === 'speed').length;
    case 'practice2':
      return today.filter((x) => x.mode === 'practice').length;
    case 'score80':
      return today.some((x) => x.mode !== 'speed' && x.myScore >= 80) ||
        (state.mirror[day]?.score ?? 0) >= 80
        ? 1
        : 0;
    default:
      return 0;
  }
}

export type BadgeId =
  'firstWin' | 'ranked10' | 'perfect' | 'streak7' | 'mirrorFirst' | 'level5' | 'speed15';

export function badgesFor(state: DemoState): BadgeId[] {
  const out: BadgeId[] = [];
  const ranked = state.matches.filter((m) => m.mode === 'ranked');
  if (ranked.some((m) => m.outcome === 'win' && !m.forfeit)) out.push('firstWin');
  if (ranked.length >= 10) out.push('ranked10');
  if (
    state.matches.some((m) => m.mode !== 'speed' && m.myScore === 100) ||
    Object.values(state.mirror).some((r) => r.score === 100)
  )
    out.push('perfect');
  if (streakFor(state.activeDays, riyadhDayKey(new Date()), ENG).days >= 7) out.push('streak7');
  if (Object.keys(state.mirror).length > 0) out.push('mirrorFirst');
  if (levelFor(totalXp(state), ENG).level >= 5) out.push('level5');
  if (state.speedBest >= 15) out.push('speed15');
  return out;
}

export type CosmeticId =
  'frame-week' | 'frame-reader' | 'frame-expert' | 'frame-elite' | 'title-cultured' | 'title-sage';

export const FRAME_RING: Record<string, string> = {
  'frame-week': 'ring-sky',
  'frame-reader': 'ring-brand',
  'frame-expert': 'ring-violet',
  'frame-elite': 'ring-gold',
};

export interface RoadReward {
  coins?: number;
  cosmetic?: CosmeticId;
  /** A partner gift: shown, not claimable until partner campaigns launch with legal approval (REGULATORY.md). */
  partner?: 'voucher' | 'product';
}

export interface RoadNode {
  id: string;
  tierIndex: number;
  /** 3 = first division of the tier, 1 = last; 0 = top tier. */
  division: number;
  /** Monthly points that reach it; null for the rank-based top tier. */
  at: number | null;
  reward: RoadReward | null;
}

/** The ladder road (ENGAGEMENT.md section 3, rewards are sample values). */
export const ROAD: RoadNode[] = (() => {
  const tiers = ENG.ladder.tiers;
  const big: Record<number, RoadReward> = {
    1: { coins: 50, cosmetic: 'frame-reader' },
    2: { coins: 75, cosmetic: 'title-cultured' },
    3: { coins: 100, partner: 'voucher' },
    4: { coins: 125, cosmetic: 'frame-expert' },
    5: { coins: 150, partner: 'product' },
    6: { coins: 200, cosmetic: 'title-sage' },
  };
  const nodes: RoadNode[] = [];
  tiers.forEach((t, i) => {
    if (t.entry === null) {
      nodes.push({
        id: `${t.id}`,
        tierIndex: i,
        division: 0,
        at: null,
        reward: { cosmetic: 'frame-elite', partner: 'voucher' },
      });
      return;
    }
    const next =
      tiers.slice(i + 1).find((x) => x.entry !== null)?.entry ?? t.entry + ENG.ladder.topTierSpan;
    const step = (next - t.entry) / ENG.ladder.divisions;
    for (let k = 0; k < ENG.ladder.divisions; k++) {
      const division = ENG.ladder.divisions - k;
      const reward = k === 0 ? (big[i] ?? null) : { coins: 10 + i * 5 + k * 5 };
      nodes.push({
        id: `${t.id}-${division}`,
        tierIndex: i,
        division,
        at: Math.round(t.entry + k * step),
        reward,
      });
    }
  });
  return nodes;
})();

export function reached(node: RoadNode, points: number, rank: number | null): boolean {
  if (node.at === null) return ladderFor(points, rank, ENG).division === 0;
  return points >= node.at;
}

export function engagementSummary(
  state: DemoState,
  points: number,
  rank: number | null,
  now = new Date(),
) {
  const day = riyadhDayKey(now);
  const xp = totalXp(state);
  return {
    day,
    month: riyadhMonthKey(now),
    xp,
    level: levelFor(xp, ENG),
    coins: coinBalance(state),
    streak: streakFor(state.activeDays, day, ENG),
    claim: claimState(state.lastClaim, day, ENG),
    ladder: ladderFor(points, rank, ENG),
  };
}
