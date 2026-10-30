import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENGAGEMENT as cfg,
  capped,
  claimState,
  daySeed,
  ladderFor,
  levelFor,
  rankedXp,
  streakFor,
} from './index.js';

describe('FR-30 progression', () => {
  it('XP for a ranked match: 20 + 2 per correct, +15 for a win', () => {
    expect(rankedXp(8, true, cfg)).toBe(51);
    expect(rankedXp(3, false, cfg)).toBe(26);
  });

  it('daily caps never grant more than what is left', () => {
    expect(capped(10, 195, 200)).toBe(5);
    expect(capped(10, 200, 200)).toBe(0);
  });

  it('levels: 100 × n XP from level n to n+1, never above 100', () => {
    expect(levelFor(0, cfg)).toEqual({ level: 1, into: 0, need: 100 });
    expect(levelFor(99, cfg).level).toBe(1);
    expect(levelFor(100, cfg)).toEqual({ level: 2, into: 0, need: 200 });
    expect(levelFor(650, cfg)).toEqual({ level: 4, into: 50, need: 400 });
    expect(levelFor(10_000_000, cfg).level).toBe(100);
  });
});

describe('FR-30 monthly ladder', () => {
  it('tiers by monthly points with three divisions each', () => {
    expect(ladderFor(0, 500, cfg)).toMatchObject({ tierIndex: 0, division: 3, nextAt: 100 });
    expect(ladderFor(250, 500, cfg)).toMatchObject({ tierIndex: 0, division: 1, nextAt: 300 });
    expect(ladderFor(300, 500, cfg)).toMatchObject({ tierIndex: 1, division: 3 });
    expect(ladderFor(4600, 500, cfg)).toMatchObject({ tierIndex: 6, division: 3 });
  });

  it('the top tier goes to the top 100 by rank among players who reached the highest points tier', () => {
    expect(ladderFor(4600, 40, cfg)).toMatchObject({ tierIndex: 7, division: 0 });
    expect(ladderFor(4600, 140, cfg).tierIndex).toBe(6);
    expect(ladderFor(1200, 40, cfg).tierIndex).toBe(2);
    expect(ladderFor(0, 1, cfg).tierIndex).toBe(0);
  });
});

describe('FR-30 daily habit', () => {
  it('streak counts consecutive Riyadh days and resets after a gap', () => {
    expect(streakFor(['2026-10-28', '2026-10-29', '2026-10-30'], '2026-10-30', cfg).days).toBe(3);
    expect(streakFor(['2026-10-28', '2026-10-29'], '2026-10-30', cfg).days).toBe(2);
    expect(streakFor(['2026-10-26', '2026-10-27'], '2026-10-30', cfg).days).toBe(0);
  });

  it('a shield earned at 7 days protects one missed day', () => {
    const week = Array.from({ length: 7 }, (_, i) => `2026-10-0${i + 1}`);
    expect(streakFor(week, '2026-10-07', cfg)).toEqual({ days: 7, shields: 1 });
    expect(streakFor([...week, '2026-10-09'], '2026-10-09', cfg)).toEqual({ days: 8, shields: 0 });
  });

  it('daily claim moves along the 7-day calendar and restarts after a missed day', () => {
    expect(claimState(null, '2026-10-30', cfg)).toEqual({ claimable: true, index: 0 });
    expect(claimState({ day: '2026-10-30', index: 2 }, '2026-10-30', cfg)).toEqual({
      claimable: false,
      index: 2,
    });
    expect(claimState({ day: '2026-10-29', index: 6 }, '2026-10-30', cfg)).toEqual({
      claimable: true,
      index: 0,
    });
    expect(claimState({ day: '2026-10-29', index: 2 }, '2026-10-30', cfg)).toEqual({
      claimable: true,
      index: 3,
    });
    expect(claimState({ day: '2026-10-27', index: 4 }, '2026-10-30', cfg)).toEqual({
      claimable: true,
      index: 0,
    });
  });

  it('Mirror Challenge: the same seed for everyone on one Riyadh day', () => {
    expect(daySeed('2026-10-30T08:00:00Z')).toBe(daySeed('2026-10-30T20:00:00Z'));
    expect(daySeed('2026-10-30T21:30:00Z')).not.toBe(daySeed('2026-10-30T20:00:00Z'));
  });
});
