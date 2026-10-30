import type { GameConfig } from './config.js';
import { DAY_MS, HOUR_MS, riyadhDayKey, riyadhMonthKey } from './time.js';

export interface RankedHistoryEntry {
  at: string;
  opponentId: string;
}

export type RankedBlock =
  | { ok: true }
  | { ok: false; reason: 'DAILY_LIMIT'; resetsAt: null }
  | { ok: false; reason: 'ABANDON_BLOCK'; resetsAt: string };

/** BR-06 and BR-12: may this player start a ranked search now? */
export function rankedAllowed(
  history: readonly RankedHistoryEntry[],
  abandons: readonly string[],
  now: Date,
  cfg: GameConfig,
): RankedBlock {
  const recent = abandons
    .map((at) => new Date(at).getTime())
    .filter((t) => now.getTime() - t < cfg.abandon.windowHours * HOUR_MS)
    .sort((a, b) => a - b);
  if (recent.length >= cfg.abandon.blockAfter) {
    const triggeredAt = recent[recent.length - 1] as number;
    const until = triggeredAt + cfg.abandon.blockHours * HOUR_MS;
    if (until > now.getTime())
      return { ok: false, reason: 'ABANDON_BLOCK', resetsAt: new Date(until).toISOString() };
  }
  if (rankedLeftToday(history, now, cfg) <= 0)
    return { ok: false, reason: 'DAILY_LIMIT', resetsAt: null };
  return { ok: true };
}

/** BR-06: ranked matches left today (Riyadh day). */
export function rankedLeftToday(
  history: readonly RankedHistoryEntry[],
  now: Date,
  cfg: GameConfig,
): number {
  const today = riyadhDayKey(now);
  return Math.max(
    0,
    cfg.dailyRankedLimit - history.filter((h) => riyadhDayKey(h.at) === today).length,
  );
}

/** BR-07: may these two players meet in ranked play now? `history` is player A's ranked history. */
export function pairAllowed(
  history: readonly RankedHistoryEntry[],
  opponentId: string,
  now: Date,
  cfg: GameConfig,
): boolean {
  const meetings = history.filter((h) => h.opponentId === opponentId);
  const last24h = meetings.filter((h) => now.getTime() - new Date(h.at).getTime() < DAY_MS).length;
  const month = riyadhMonthKey(now);
  const thisMonth = meetings.filter((h) => riyadhMonthKey(h.at) === month).length;
  return last24h < cfg.samePair.per24h && thisMonth < cfg.samePair.perMonth;
}
