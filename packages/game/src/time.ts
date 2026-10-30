/**
 * Riyadh calendar helpers. Saudi Arabia keeps UTC+3 all year (no daylight saving), so a fixed offset is exact.
 * Timestamps are stored as UTC ISO strings; days and months are cut in Riyadh time.
 */
const RIYADH_OFFSET_MS = 3 * 60 * 60 * 1000;

const shift = (at: Date | string) => new Date(new Date(at).getTime() + RIYADH_OFFSET_MS);

/** 'YYYY-MM' of the Riyadh calendar month. */
export function riyadhMonthKey(at: Date | string): string {
  return shift(at).toISOString().slice(0, 7);
}

/** 'YYYY-MM-DD' of the Riyadh calendar day. */
export function riyadhDayKey(at: Date | string): string {
  return shift(at).toISOString().slice(0, 10);
}

/** BR-16: the month freezes at 23:59:59 Riyadh time on its last day. Returns that instant. */
export function monthFreezeAt(at: Date | string): Date {
  const local = shift(at);
  const nextMonthStartUtc =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - RIYADH_OFFSET_MS;
  return new Date(nextMonthStartUtc - 1000);
}

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
