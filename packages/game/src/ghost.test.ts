import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG as cfg } from './config.js';
import { ghostDue, inviteCode, isInviteCode, pickGhost } from './ghost.js';
import { searchStep } from './matchmaking.js';
import { seededRng } from './rng.js';

describe('matching (CR v3 section 7)', () => {
  it('matches on rating: ±100, widening by 100 every 5 s', () => {
    expect(searchStep(0, cfg).step.ratingBand).toBe(100);
    expect(searchStep(5, cfg).step.ratingBand).toBe(200);
    expect(searchStep(14, cfg).step.ratingBand).toBe(300);
    expect(searchStep(19, cfg).step).toMatchObject({ ratingBand: 400, maxKm: null, sameCity: false });
  });
  it('offers a ghost after 20 s, replaying the closest-rated recording', () => {
    expect(ghostDue(19.9, cfg)).toBe(false);
    expect(ghostDue(20, cfg)).toBe(true);
    expect(pickGhost([{ id: 'a', rating: 900 }, { id: 'b', rating: 1080 }], 1050)?.id).toBe('b');
    expect(pickGhost([], 1000)).toBeNull();
  });
  it('makes shareable invite codes', () => {
    const code = inviteCode(seededRng(7));
    expect(isInviteCode(code)).toBe(true);
    expect(isInviteCode('abc')).toBe(false);
  });
});
