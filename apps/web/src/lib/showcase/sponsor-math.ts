/**
 * Sponsor value for /showcase (demo data). A sponsored question holds attention for its whole question time
 * (10 s per view), against a traditional ad that is skipped after about 2 s. Money in halalas.
 */
import { DEFAULT_CONFIG, prizePoolHalalas } from '@quizate/game';

export const ATTENTION_SECONDS_PER_VIEW = DEFAULT_CONFIG.questionSeconds;
export const TRADITIONAL_AD_SECONDS = 2;
export const DAYS_PER_MONTH = 30;

export const attentionSeconds = (views: number) => views * ATTENTION_SECONDS_PER_VIEW;
export const traditionalSeconds = (views: number) => views * TRADITIONAL_AD_SECONDS;

export interface CalcInput {
  /** Sponsored questions in each match. */
  questionsPerMatch: number;
  dailyPlayers: number;
  /** Price per 1,000 views, halalas. */
  pricePer1000Halalas: number;
  /** Assumption shown on screen: one match per player per day. */
  matchesPerPlayer?: number;
}

/** Calculator: monthly views and SAR (halalas), and the share of the monthly prize pool that would fund. */
export function sponsorCalc(c: CalcInput): {
  monthlyViews: number;
  monthlyHalalas: number;
  poolShare: number;
} {
  const monthlyViews =
    Math.max(0, Math.floor(c.questionsPerMatch)) *
    Math.max(0, Math.floor(c.dailyPlayers)) *
    (c.matchesPerPlayer ?? 1) *
    DAYS_PER_MONTH;
  const monthlyHalalas = Math.floor((monthlyViews * c.pricePer1000Halalas) / 1000);
  return { monthlyViews, monthlyHalalas, poolShare: poolShareOf(monthlyHalalas) };
}

/** Share (0-1) of the full monthly prize pool (SAR 16,500) that a sum funds. */
export const poolShareOf = (halalas: number) =>
  Math.min(1, halalas / prizePoolHalalas(DEFAULT_CONFIG.prizeTableHalalas));
