/**
 * Feature flags (Sabbaq change request v3, section 2). MVP features are on; the rest are off but their code is kept.
 * Like every business default these are configuration: the server loads them from its config table, the web demo
 * keeps a copy. `prizes_cash_18plus` only shows the prize rules: activating a cash campaign still needs
 * `prizes.enabled` and a legal approval record (architecture rule 5).
 */
export const FEATURE_FLAGS = {
  classic_1v1: true,
  categories: true,
  rating_monthly: true,
  sponsored_questions: true,
  prizes_cash_18plus: true,
  youth_award: true,
  challenge_friend: true,
  ghost_opponent: true,
  ladder: false,
  mirror_challenge: false,
  speed_round: false,
  practice_bot: false,
  daily_claim: false,
  missions: false,
  nearby_matching: false,
  iban_api: false,
  nafath_required: false,
  membership: false,
  /**
   * Owner decision 15 Nov 2026: while ghost answers are generated (no stored real matches yet), ghost matches change
   * no rating and count for no qualification or prizes.
   * TODO(owner): switch on once the match server replays real recorded matches.
   */
  ghost_counts_for_rating: false,
} as const satisfies Record<string, boolean>;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;
export type FeatureFlags = Record<FeatureFlag, boolean>;

export const isOn = (flag: FeatureFlag, flags: Partial<FeatureFlags> = FEATURE_FLAGS): boolean =>
  flags[flag] ?? FEATURE_FLAGS[flag];
