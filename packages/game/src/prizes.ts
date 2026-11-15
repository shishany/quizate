/** Formats halalas (integer, SAR × 100) as SAR without floating-point drift. */
export function halalasToSar(halalas: number): string {
  const sign = halalas < 0 ? '-' : '';
  const abs = Math.abs(Math.trunc(halalas));
  const sar = Math.trunc(abs / 100);
  const rest = abs % 100;
  return `${sign}${sar.toLocaleString('en-US')}${rest ? `.${String(rest).padStart(2, '0')}` : ''}`;
}

export function prizePoolHalalas(table: readonly number[]): number {
  return table.reduce((s, x) => s + x, 0);
}

/** Sabbaq CR v3 section 9: monthly pool = min(table total, sponsor funding for the month), in halalas. */
export function monthlyPoolHalalas(table: readonly number[], sponsorFundingHalalas: number): number {
  return Math.max(0, Math.min(prizePoolHalalas(table), Math.trunc(sponsorFundingHalalas)));
}

/** Every rank scaled by pool / table total, rounded down to SAR 10 (1,000 halalas). Integer maths only. */
export function scaledPrizeTable(table: readonly number[], poolHalalas: number): number[] {
  const total = prizePoolHalalas(table);
  if (total <= 0) return table.map(() => 0);
  return table.map((h) => Math.floor((h * poolHalalas) / total / 1000) * 1000);
}

/**
 * Payout queue (owner decision on CR v3, 15 Nov 2026). At month close the queue is built from the ranking: the top
 * places go to players with >= 60 qualifying matches whose declared date of birth says 18+, each starting at
 * `id_check_pending`. An admin checks the ID and the IBAN certificate name: a pass sets id_verified, which makes the
 * player cash_eligible, and only then can the place be marked paid. If the check fails, or the ID shows the player
 * is under 18, the place passes to the next eligible player in the ranking and the replacement is logged.
 */
export type PayoutStatus = 'id_check_pending' | 'cash_eligible' | 'paid';

export type CheckFailure = 'id_mismatch' | 'iban_name_mismatch' | 'under_18';

export interface PayoutCheck {
  /** passed = ID and IBAN name both checked; failed = the place goes to the next player. */
  result: 'passed' | 'failed';
  failure?: CheckFailure;
  paid?: boolean;
}

export interface QueueCandidate {
  playerId: string;
  /** Qualified this month (>= 60 completed non-ghost, non-friend matches). */
  qualified: boolean;
  /** Declared (or Nafath) date of birth, YYYY-MM-DD. */
  birthDate: string;
}

export interface QueuePlace {
  /** 1-based prize place. */
  place: number;
  playerId: string;
  status: PayoutStatus;
  amountHalalas: number;
}

export interface QueueLogEntry {
  playerId: string;
  reason: 'not_qualified' | 'under_18_by_dob' | CheckFailure;
  /** Place the player held (checks) or would have reached (skipped by date of birth); null if never reached. */
  place: number | null;
}

/** Whole years on `at` (UTC calendar dates). */
function yearsOn(birthDate: string, at: Date): number {
  const b = new Date(`${birthDate}T00:00:00Z`);
  let age = at.getUTCFullYear() - b.getUTCFullYear();
  const m = at.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && at.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

/**
 * Builds the queue for a closed month. `ranking` is in leaderboard order; `checks` holds the admin's results so
 * far; `prizes` the scaled amounts per place. Players are taken in rank order, skipping anyone not qualified,
 * under 18 by date of birth at month close, or whose check failed, until every place is filled or the ranking ends.
 */
export function payoutQueue(
  ranking: readonly QueueCandidate[],
  checks: ReadonlyMap<string, PayoutCheck>,
  prizes: readonly number[],
  monthClose: Date,
): { places: QueuePlace[]; log: QueueLogEntry[] } {
  const places: QueuePlace[] = [];
  const log: QueueLogEntry[] = [];
  for (const c of ranking) {
    if (places.length >= prizes.length) break;
    if (!c.qualified) continue;
    const place = places.length + 1;
    if (yearsOn(c.birthDate, monthClose) < 18) {
      log.push({ playerId: c.playerId, reason: 'under_18_by_dob', place: null });
      continue;
    }
    const check = checks.get(c.playerId);
    if (check?.result === 'failed') {
      log.push({ playerId: c.playerId, reason: check.failure ?? 'id_mismatch', place });
      continue;
    }
    places.push({
      place,
      playerId: c.playerId,
      status: check?.result === 'passed' ? (check.paid ? 'paid' : 'cash_eligible') : 'id_check_pending',
      amountHalalas: prizes[place - 1] ?? 0,
    });
  }
  return { places, log };
}

/** Only a cash-eligible place (check passed) can be marked paid. */
export const canMarkPaid = (p: QueuePlace): boolean => p.status === 'cash_eligible';
