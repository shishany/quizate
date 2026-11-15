/**
 * Age rules (Sabbaq change request v3, section 3). Under 13 cannot sign up; 13-17 is the youth group and plays only
 * once a guardian has granted consent; cash prizes need 18+ and an ID checked by an admin at payout.
 */
export const AGE = { min: 13, adult: 18 } as const;

export type AgeGroup = 'youth' | 'adult';
export type ConsentStatus = 'not_required' | 'pending' | 'granted';

/** Whole years on `now` (UTC dates; birth dates are calendar dates). */
export function ageOn(birthDate: string, now: Date): number {
  const b = new Date(`${birthDate}T00:00:00Z`);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

export type SignupAge =
  | { ok: false; reason: 'UNDER_MIN_AGE' }
  | { ok: true; ageGroup: AgeGroup; consentStatus: ConsentStatus };

export function signupAge(birthDate: string, now: Date, min = AGE.min, adult = AGE.adult): SignupAge {
  const age = ageOn(birthDate, now);
  if (age < min) return { ok: false, reason: 'UNDER_MIN_AGE' };
  return age < adult
    ? { ok: true, ageGroup: 'youth', consentStatus: 'pending' }
    : { ok: true, ageGroup: 'adult', consentStatus: 'not_required' };
}

/** A youth account plays only once its guardian consent is granted. */
export const canPlay = (p: { ageGroup?: AgeGroup; consentStatus?: ConsentStatus }): boolean =>
  p.ageGroup !== 'youth' || p.consentStatus === 'granted';

/** cash_eligible = age >= 18 AND id_verified (set by an admin at payout). */
export const cashEligible = (birthDate: string, idVerified: boolean, now: Date, adult = AGE.adult): boolean =>
  ageOn(birthDate, now) >= adult && idVerified === true;

export interface GuardianConsent {
  /** When the guardian confirmed the OTP. */
  at: string;
  /** SHA-256 (hex) of the guardian's normalised mobile; the number itself is not kept. */
  guardianPhoneHash: string;
}
