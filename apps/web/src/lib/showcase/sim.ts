/**
 * Live simulation for /showcase only ("بيانات توضيحية · Demo data"). Seeded fake players with Saudi first names and
 * cities play each other on a timer; nothing is stored or sent. Ratings move with the real Elo rule.
 */
import {
  DEFAULT_CONFIG,
  MATCH_CATEGORIES,
  updateRatings,
  type MatchCategoryId,
  type Rng,
} from '@quizate/game';

export interface SimPlayer {
  id: string;
  name: { ar: string; en: string };
  /** For Arabic verb agreement in the feed. */
  female: boolean;
  cityId: string;
  rating: number;
  youth: boolean;
}

export interface FeedItem {
  id: number;
  winnerId: string;
  loserId: string;
  delta: number;
  category: MatchCategoryId;
}

export interface SimState {
  tick: number;
  players: SimPlayer[];
  feed: FeedItem[];
  counters: { playersToday: number; matchesToday: number; questionsAnswered: number };
  byCategory: Record<MatchCategoryId, number>;
}

const NAMES: [string, string, boolean][] = [
  ['نورة', 'Noura', true],
  ['عبدالله', 'Abdullah', false],
  ['سارة', 'Sarah', true],
  ['فهد', 'Fahad', false],
  ['ريم', 'Reem', true],
  ['خالد', 'Khalid', false],
  ['لمى', 'Lama', true],
  ['سلطان', 'Sultan', false],
  ['هيا', 'Haya', true],
  ['تركي', 'Turki', false],
  ['جود', 'Joud', true],
  ['ماجد', 'Majed', false],
  ['دانة', 'Dana', true],
  ['نايف', 'Nayef', false],
  ['شهد', 'Shahad', true],
  ['بندر', 'Bandar', false],
  ['العنود', 'Alanoud', true],
  ['راكان', 'Rakan', false],
  ['غادة', 'Ghada', true],
  ['مشاري', 'Mishari', false],
  ['أسيل', 'Aseel', true],
  ['يزيد', 'Yazeed', false],
  ['رهف', 'Rahaf', true],
  ['عمر', 'Omar', false],
];
const CITY_IDS = [
  'riyadh',
  'jeddah',
  'makkah',
  'madinah',
  'dammam',
  'khobar',
  'abha',
  'tabuk',
  'buraydah',
  'hail',
];
const CATEGORY_IDS = MATCH_CATEGORIES.filter((c) => c.id !== 'mixed').map((c) => c.id);

export function initialSim(rng: Rng, hourOfDay: number): SimState {
  const players = NAMES.map(([ar, en, female], i) => ({
    id: `sim-${i}`,
    name: { ar, en },
    female,
    cityId: CITY_IDS[i % CITY_IDS.length]!,
    rating: Math.round(940 + rng() * 140),
    youth: i % 5 === 2,
  }));
  // Today's counters grow with the hour so the numbers look like a day in progress.
  const share = Math.max(0.15, hourOfDay / 24);
  const matchesToday = Math.round((2_600 + rng() * 800) * share);
  const byCategory = Object.fromEntries(MATCH_CATEGORIES.map((c) => [c.id, 0])) as Record<
    MatchCategoryId,
    number
  >;
  for (const id of CATEGORY_IDS) byCategory[id] = Math.round(matchesToday * (0.1 + rng() * 0.15));
  return {
    tick: 0,
    players,
    feed: [],
    counters: {
      playersToday: Math.round(matchesToday * 0.42),
      matchesToday,
      questionsAnswered: matchesToday * DEFAULT_CONFIG.questionsPerMatch * 2,
    },
    byCategory,
  };
}

/** One step: one featured match (shown in the feed and on the board) plus background activity for the counters. */
export function stepSim(state: SimState, rng: Rng): SimState {
  const n = state.players.length;
  const a = Math.floor(rng() * n);
  const b = (a + 1 + Math.floor(rng() * (n - 1))) % n;
  const pa = state.players[a]!;
  const pb = state.players[b]!;
  const expectedA = 1 / (1 + 10 ** ((pb.rating - pa.rating) / 400));
  const aWins = rng() < expectedA;
  const r = updateRatings(pa.rating, pb.rating, aWins ? 'win' : 'loss', DEFAULT_CONFIG);
  const players = state.players.map((p, i) =>
    i === a ? { ...p, rating: r.a } : i === b ? { ...p, rating: r.b } : p,
  );
  const category = CATEGORY_IDS[Math.floor(rng() * CATEGORY_IDS.length)]!;
  const background = 1 + Math.floor(rng() * 3);
  const item: FeedItem = {
    id: state.tick + 1,
    winnerId: aWins ? pa.id : pb.id,
    loserId: aWins ? pb.id : pa.id,
    delta: Math.abs(r.a - pa.rating),
    category,
  };
  return {
    tick: state.tick + 1,
    players,
    feed: [item, ...state.feed].slice(0, 8),
    counters: {
      playersToday: state.counters.playersToday + (rng() < 0.6 ? 1 : 0),
      matchesToday: state.counters.matchesToday + background,
      questionsAnswered:
        state.counters.questionsAnswered + background * DEFAULT_CONFIG.questionsPerMatch * 2,
    },
    byCategory: { ...state.byCategory, [category]: state.byCategory[category] + background },
  };
}

export const boardOf = (s: SimState): SimPlayer[] =>
  [...s.players].sort((x, y) => y.rating - x.rating);
