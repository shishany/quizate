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

export type PayoutStatus = 'pending_review' | 'approved' | 'paid' | 'rejected';

export interface PayoutReview {
  /** Admin checked the ID (sets id_verified). */
  idChecked: boolean;
  /** The name on the IBAN certificate matches the ID. */
  ibanNameMatches: boolean;
}

/** A payout can be approved (and then marked paid) only after both manual checks. */
export const reviewPassed = (r: PayoutReview): boolean => r.idChecked && r.ibanNameMatches;

const NEXT: Record<PayoutStatus, readonly PayoutStatus[]> = {
  pending_review: ['approved', 'rejected'],
  approved: ['paid', 'rejected'],
  paid: [],
  rejected: [],
};

export function canMovePayout(from: PayoutStatus, to: PayoutStatus, review: PayoutReview): boolean {
  if (!NEXT[from].includes(to)) return false;
  return to === 'rejected' || reviewPassed(review);
}
