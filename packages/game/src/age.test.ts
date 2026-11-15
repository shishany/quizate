import { describe, expect, it } from 'vitest';
import { canPlay, cashEligible, signupAge } from './age.js';

const now = new Date('2026-11-15T12:00:00Z');

describe('age 13+ (CR v3 section 3)', () => {
  it('blocks under 13, makes 13-17 youth pending consent, 18+ adult', () => {
    expect(signupAge('2014-01-01', now)).toEqual({ ok: false, reason: 'UNDER_MIN_AGE' });
    expect(signupAge('2013-11-15', now)).toEqual({ ok: true, ageGroup: 'youth', consentStatus: 'pending' });
    expect(signupAge('2008-11-15', now)).toEqual({ ok: true, ageGroup: 'adult', consentStatus: 'not_required' });
  });
  it('youth plays only with granted consent', () => {
    expect(canPlay({ ageGroup: 'youth', consentStatus: 'pending' })).toBe(false);
    expect(canPlay({ ageGroup: 'youth', consentStatus: 'granted' })).toBe(true);
    expect(canPlay({ ageGroup: 'adult', consentStatus: 'not_required' })).toBe(true);
  });
  it('cash_eligible needs 18+ and an admin-verified ID', () => {
    expect(cashEligible('2000-01-01', false, now)).toBe(false);
    expect(cashEligible('2000-01-01', true, now)).toBe(true);
    expect(cashEligible('2010-01-01', true, now)).toBe(false);
  });
});
