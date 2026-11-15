/**
 * Showcase phases (/showcase only). The phase sets feature flags for this browser session; normal routes keep the
 * MVP flags from `FEATURE_FLAGS`. Phase 3 items are placeholders ("coming soon"): they have no flag and no code yet.
 */
import { FEATURE_FLAGS, type FeatureFlag, type FeatureFlags } from '@quizate/game';

export type Phase = 'mvp' | 'p2' | 'p3';
export const PHASES: readonly Phase[] = ['mvp', 'p2', 'p3'];

/** Flags Phase 2 switches on. `nafath_required` is shown as view only. */
export const PHASE2_FLAGS = [
  'ladder',
  'mirror_challenge',
  'speed_round',
  'practice_bot',
  'daily_claim',
  'missions',
  'nearby_matching',
  'nafath_required',
  'locale_ur',
] as const satisfies readonly FeatureFlag[];

export const VIEW_ONLY: readonly FeatureFlag[] = ['nafath_required'];

export const PHASE3_ITEMS = [
  'clubs',
  'team_trivia',
  'team_sudoku',
  'word_game',
  'city_leaderboards',
  'sponsor_self_service',
] as const;
export type Phase3Item = (typeof PHASE3_ITEMS)[number];

/** Session flags for a phase: MVP = the current flags; Phase 2 and 3 add the Phase 2 flags. */
export function flagsFor(phase: Phase): FeatureFlags {
  const flags: FeatureFlags = { ...FEATURE_FLAGS };
  if (phase !== 'mvp') for (const f of PHASE2_FLAGS) flags[f] = true;
  return flags;
}

/** The phase a flag belongs to, for its badge: 'mvp' when the MVP already has it on. */
export function phaseOf(flag: FeatureFlag): Phase {
  if (FEATURE_FLAGS[flag]) return 'mvp';
  return (PHASE2_FLAGS as readonly FeatureFlag[]).includes(flag) ? 'p2' : 'p3';
}

export const phaseRank = (p: Phase): number => PHASES.indexOf(p);
