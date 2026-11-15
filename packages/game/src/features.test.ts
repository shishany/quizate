import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS, isOn } from './features.js';

describe('feature flags (CR v3 section 2)', () => {
  it('turns on only the MVP features', () => {
    const on = Object.entries(FEATURE_FLAGS).filter(([, v]) => v).map(([k]) => k).sort();
    expect(on).toEqual(
      ['categories', 'challenge_friend', 'classic_1v1', 'ghost_opponent', 'prizes_cash_18plus',
        'rating_monthly', 'sponsored_questions', 'youth_award'].sort(),
    );
    expect(isOn('ladder')).toBe(false);
    expect(isOn('nafath_required')).toBe(false);
    expect(isOn('ladder', { ladder: true })).toBe(true);
  });
});
