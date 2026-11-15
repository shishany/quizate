import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS } from '@quizate/game';
import { PHASE2_FLAGS, flagsFor, phaseOf } from './phases';

describe('showcase phases', () => {
  it('MVP is exactly the current flags', () => {
    expect(flagsFor('mvp')).toEqual(FEATURE_FLAGS);
  });
  it('Phase 2 and 3 add the Phase 2 flags and nothing else', () => {
    for (const p of ['p2', 'p3'] as const) {
      const f = flagsFor(p);
      for (const k of PHASE2_FLAGS) expect(f[k]).toBe(true);
      expect(f.iban_api).toBe(false);
      expect(f.membership).toBe(false);
      expect(f.ghost_counts_for_rating).toBe(false);
    }
  });
  it('badges each flag with its phase', () => {
    expect(phaseOf('classic_1v1')).toBe('mvp');
    expect(phaseOf('ladder')).toBe('p2');
    expect(phaseOf('locale_ur')).toBe('p2');
  });
});
