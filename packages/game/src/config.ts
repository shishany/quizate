/**
 * Game configuration. Every value is a default from the BRD (section number in the comment) or, where the BRD is
 * silent, from the build prompts; none may be read as a constant elsewhere (architecture rule 4). The server will
 * load these from its config table; the web demo keeps an editable copy.
 */
export interface GameConfig {
  /** BR-01 */ pointsPerCorrect: number;
  /** BR-01 */ questionsPerMatch: number;
  /** Sabbaq CR v3 section 5: 10 s per question, timed by the server */ questionSeconds: number;
  /**
   * Sabbaq CR v3 section 5: a correct answer scores clamp(round(base - perSecond * elapsed_s), min, pointsPerCorrect);
   * wrong or timeout scores 0. `pointsPerCorrect` is the maximum (10), so a match is worth at most 100.
   */
  speedPoints: { base: number; perSecond: number; min: number };
  /** BR-04, as fractions of the player's own match score */
  monthlyShare: { win: number; loss: number; draw: number };
  /** BR-05 */ monthlyCap: number;
  /** BR-06 */ dailyRankedLimit: number;
  /** BR-07 */ samePair: { per24h: number; perMonth: number };
  /**
   * Sabbaq CR v3 section 6: prize qualification is >= 60 completed (non-ghost) matches in the month. The old rule of
   * 10 distinct opponents is removed (0 = off).
   */
  eligibility: { minMatches: number; minOpponents: number };
  /** Sabbaq CR v3 section 6: monthly Elo, everyone starts each Riyadh month at 1,000, K = 32. */
  rating: { start: number; k: number };
  /** BR-11, BR-12 */ abandon: {
    graceSeconds: number;
    blockAfter: number;
    windowHours: number;
    blockHours: number;
  };
  /** BR-13 */ questionRepeatDays: number;
  /** BR-14 */ maxSponsored: number;
  /** Build prompt 4 (default mix) */ difficultyMix: { easy: number; medium: number; hard: number };
  /** BRD section 4, steps 1-5 */ matchmaking: MatchmakingStep[];
  /** Build prompt 5 */ acceptSeconds: number;
  /** BRD section 3, fair-play signals */ fairPlay: { minHumanMs: number; maxFastAnswers: number };
  /** Web demo mode, not in the BRD (unranked) */ speedRound: { seconds: number };
  /** BRD section 1; build prompt 10: 10,000 down to 1,000 SAR, in halalas */ prizeTableHalalas: number[];
  /** Sabbaq CR v3 section 6: how many top youth players get the youth badge (in-kind award). Not given; default 3. */
  youthAwardSlots: number;
}

export interface MatchmakingStep {
  /** Applies from this many seconds of waiting. */
  fromSeconds: number;
  /** Search radius; null = no distance limit. */
  maxKm: number | null;
  /** Rating window (±); null = any rating. */
  ratingBand: number | null;
  sameCity: boolean;
  /** Offer a practice match instead (step 5). */
  offerPractice: boolean;
}

export const DEFAULT_CONFIG: GameConfig = {
  pointsPerCorrect: 10,
  questionsPerMatch: 10,
  questionSeconds: 10,
  speedPoints: { base: 10, perSecond: 0.5, min: 5 },
  monthlyShare: { win: 1, loss: 0.25, draw: 0.5 },
  monthlyCap: 60,
  dailyRankedLimit: 10,
  samePair: { per24h: 1, perMonth: 4 },
  eligibility: { minMatches: 60, minOpponents: 0 },
  rating: { start: 1000, k: 32 },
  abandon: { graceSeconds: 20, blockAfter: 3, windowHours: 24, blockHours: 24 },
  questionRepeatDays: 90,
  maxSponsored: 2,
  difficultyMix: { easy: 3, medium: 4, hard: 3 },
  matchmaking: [
    { fromSeconds: 0, maxKm: 10, ratingBand: 150, sameCity: false, offerPractice: false },
    { fromSeconds: 10, maxKm: 50, ratingBand: 250, sameCity: false, offerPractice: false },
    { fromSeconds: 20, maxKm: null, ratingBand: null, sameCity: true, offerPractice: false },
    { fromSeconds: 30, maxKm: null, ratingBand: null, sameCity: false, offerPractice: false },
    { fromSeconds: 60, maxKm: null, ratingBand: null, sameCity: false, offerPractice: true },
  ],
  acceptSeconds: 10,
  fairPlay: { minHumanMs: 800, maxFastAnswers: 2 },
  speedRound: { seconds: 60 },
  youthAwardSlots: 3,
  prizeTableHalalas: [10_000, 9_000, 8_000, 7_000, 6_000, 5_000, 4_000, 3_000, 2_000, 1_000].map(
    (sar) => sar * 100,
  ),
};
