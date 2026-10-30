import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CONFIG as cfg,
  averageLatencyMs,
  botAnswer,
  distanceBand,
  findOpponent,
  halalasToSar,
  inhumanSpeedFlag,
  matchScore,
  monthFreezeAt,
  monthlyPoints,
  outcomeFor,
  pairAllowed,
  prizePoolHalalas,
  rankStandings,
  rankedAllowed,
  rankedLeftToday,
  riyadhDayKey,
  riyadhMonthKey,
  roundCoord,
  searchStep,
  seededRng,
  selectQuestions,
  standingFor,
  updateRatings,
  type AnswerRecord,
  type Difficulty,
  type RankedResult,
  type SelectableQuestion,
} from './index.js';

const ans = (correct: boolean, latencyMs: number | null = 3000): AnswerRecord => ({
  option: latencyMs === null ? null : 0,
  correct,
  latencyMs,
});

describe('scoring', () => {
  it('BR-01: 10 points per correct answer, 0 for wrong or timeout, max 100', () => {
    expect(matchScore([ans(true), ans(false), ans(false, null)], cfg)).toBe(10);
    expect(
      matchScore(
        Array.from({ length: 10 }, () => ans(true)),
        cfg,
      ),
    ).toBe(100);
  });

  it('BR-02: speed adds nothing to the score and is kept for tie-breaks', () => {
    expect(matchScore([ans(true, 900)], cfg)).toBe(matchScore([ans(true, 14000)], cfg));
    expect(averageLatencyMs([ans(true, 1000), ans(false, 3000), ans(false, null)])).toBe(2000);
  });

  it('BR-03: higher score wins, equal is a draw', () => {
    expect(outcomeFor(70, 60)).toBe('win');
    expect(outcomeFor(60, 70)).toBe('loss');
    expect(outcomeFor(50, 50)).toBe('draw');
  });
});

const result = (i: number, over: Partial<RankedResult> = {}): RankedResult => ({
  matchId: `m${i}`,
  at: new Date(Date.UTC(2026, 9, 1, 9, i)).toISOString(),
  opponentId: `o${i % 12}`,
  outcome: 'win',
  score: 80,
  correct: 8,
  questions: 10,
  latencyTotalMs: 30000,
  answered: 10,
  ...over,
});

describe('monthly ranking', () => {
  it('BR-04: winner 100%, loser 25%, draw 50% of own score', () => {
    expect(monthlyPoints('win', 80, cfg)).toBe(80);
    expect(monthlyPoints('loss', 70, cfg)).toBe(17.5);
    expect(monthlyPoints('draw', 60, cfg)).toBe(30);
  });

  it('BR-05: only the first 60 ranked matches of the Riyadh month count', () => {
    const results = Array.from({ length: 65 }, (_, i) => result(i));
    const s = standingFor('p', results, '2026-10', cfg);
    expect(s.counted).toBe(60);
    expect(s.played).toBe(65);
    expect(s.points).toBe(60 * 80);
  });

  it('BR-05: a match at 22:00 UTC on the last day belongs to the next Riyadh month', () => {
    expect(riyadhMonthKey('2026-10-31T21:30:00Z')).toBe('2026-11');
    expect(riyadhMonthKey('2026-10-31T20:59:59Z')).toBe('2026-10');
  });

  it('BR-08: eligible with at least 20 qualified matches against at least 10 distinct opponents', () => {
    const twenty = Array.from({ length: 20 }, (_, i) => result(i));
    expect(standingFor('p', twenty, '2026-10', cfg).eligible).toBe(true);
    const fewOpponents = twenty.map((r, i) => ({ ...r, opponentId: `o${i % 9}` }));
    expect(standingFor('p', fewOpponents, '2026-10', cfg).eligible).toBe(false);
    expect(standingFor('p', twenty.slice(0, 19), '2026-10', cfg).eligible).toBe(false);
  });

  it('BR-10: points, then accuracy, then average time, then who reached the points first', () => {
    const base = standingFor('a', [result(1)], '2026-10', cfg);
    const ranked = rankStandings([
      { ...base, playerId: 'slow', avgLatencyMs: 5000 },
      { ...base, playerId: 'late', avgLatencyMs: 3000, reachedAt: '2026-10-20T00:00:00Z' },
      { ...base, playerId: 'early', avgLatencyMs: 3000, reachedAt: '2026-10-02T00:00:00Z' },
      { ...base, playerId: 'accurate', accuracy: 0.95 },
      { ...base, playerId: 'top', points: 500 },
    ]);
    expect(ranked.map((r) => r.playerId)).toEqual(['top', 'accurate', 'early', 'late', 'slow']);
  });

  it('BR-17: ineligible players get no prize rank and the next eligible player moves up', () => {
    const base = standingFor('a', [result(1)], '2026-10', cfg);
    const ranked = rankStandings([
      { ...base, playerId: 'first', points: 300, eligible: false },
      { ...base, playerId: 'second', points: 200, eligible: true },
    ]);
    expect(ranked.map((r) => [r.playerId, r.rank, r.prizeRank])).toEqual([
      ['first', 1, null],
      ['second', 2, 1],
    ]);
  });

  it('BR-16: the month freezes at 23:59:59 Riyadh time on its last day', () => {
    expect(monthFreezeAt('2026-10-15T10:00:00Z').toISOString()).toBe('2026-10-31T20:59:59.000Z');
    expect(monthFreezeAt('2026-12-31T22:00:00Z').toISOString()).toBe('2027-01-31T20:59:59.000Z');
  });
});

describe('rating', () => {
  it('BR-09: Elo with K=24; equal ratings move by 12', () => {
    expect(updateRatings(1200, 1200, 'win', cfg)).toEqual({ a: 1212, b: 1188 });
    expect(updateRatings(1200, 1200, 'draw', cfg)).toEqual({ a: 1200, b: 1200 });
    const upset = updateRatings(1000, 1400, 'win', cfg);
    expect(upset.a - 1000).toBeGreaterThan(12);
  });
});

describe('limits', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('BR-06: 10 ranked matches per Riyadh day', () => {
    const today = Array.from({ length: 10 }, (_, i) => ({
      at: `2026-10-20T0${i % 10}:00:00Z`,
      opponentId: `o${i}`,
    }));
    expect(rankedLeftToday(today.slice(0, 7), now, cfg)).toBe(3);
    expect(rankedAllowed(today, [], now, cfg)).toEqual({
      ok: false,
      reason: 'DAILY_LIMIT',
      resetsAt: null,
    });
    expect(riyadhDayKey('2026-10-19T21:00:00Z')).toBe('2026-10-20');
  });

  it('BR-07: a pair meets at most once per 24 hours and 4 times a month', () => {
    const h = [{ at: '2026-10-20T01:00:00Z', opponentId: 'x' }];
    expect(pairAllowed(h, 'x', now, cfg)).toBe(false);
    expect(pairAllowed(h, 'y', now, cfg)).toBe(true);
    const four = ['01', '03', '05', '07'].map((d) => ({
      at: `2026-10-${d}T10:00:00Z`,
      opponentId: 'x',
    }));
    expect(pairAllowed(four, 'x', now, cfg)).toBe(false);
    expect(pairAllowed(four.slice(0, 3), 'x', now, cfg)).toBe(true);
  });

  it('BR-12: 3 abandons in 24 hours block ranked play for 24 hours', () => {
    const abandons = ['2026-10-20T02:00:00Z', '2026-10-20T05:00:00Z', '2026-10-20T08:00:00Z'];
    expect(rankedAllowed([], abandons, now, cfg)).toEqual({
      ok: false,
      reason: 'ABANDON_BLOCK',
      resetsAt: '2026-10-21T08:00:00.000Z',
    });
    expect(rankedAllowed([], abandons.slice(0, 2), now, cfg)).toEqual({ ok: true });
  });
});

describe('matchmaking (BRD section 4, FR-05)', () => {
  const me = { id: 'me', rating: 1200, cityId: 'riyadh', location: { lat: 24.71, lng: 46.68 } };

  it('widens the search by wait time', () => {
    expect(searchStep(0, cfg).step).toMatchObject({ maxKm: 10, ratingBand: 150 });
    expect(searchStep(12, cfg).step).toMatchObject({ maxKm: 50, ratingBand: 250 });
    expect(searchStep(25, cfg).step).toMatchObject({ sameCity: true });
    expect(searchStep(45, cfg).index).toBe(3);
    expect(searchStep(61, cfg).step.offerPractice).toBe(true);
  });

  it('prefers near players within the rating band, then falls back nationwide', () => {
    const near = {
      id: 'near',
      rating: 1300,
      cityId: 'riyadh',
      location: { lat: 24.75, lng: 46.7 },
    };
    const farStrong = {
      id: 'jeddah',
      rating: 1210,
      cityId: 'jeddah',
      location: { lat: 21.54, lng: 39.17 },
    };
    expect(findOpponent(me, [near, farStrong], 0, cfg)).toMatchObject({
      opponent: { id: 'near' },
      band: 'under10',
    });
    expect(findOpponent(me, [farStrong], 5, cfg)).toBeNull();
    expect(findOpponent(me, [farStrong], 35, cfg)).toMatchObject({
      opponent: { id: 'jeddah' },
      band: 'saudi',
    });
  });

  it('shows a band, never coordinates, and rounds stored coordinates to about 1 km', () => {
    expect(distanceBand(3, true)).toBe('under10');
    expect(distanceBand(30, false)).toBe('from10to50');
    expect(distanceBand(null, true)).toBe('sameCity');
    expect(roundCoord(24.713552)).toBe(24.71);
  });
});

const bank: (SelectableQuestion & { n: number })[] = Array.from({ length: 60 }, (_, n) => ({
  id: `q${n}`,
  n,
  difficulty: (['easy', 'medium', 'hard'] as const)[n % 3] as Difficulty,
  status: 'published',
  expiresAt: null,
  sponsored: n % 5 === 0,
}));

describe('question selection', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('uses the configured difficulty mix (3 easy, 4 medium, 3 hard)', () => {
    const r = selectQuestions(bank, new Map(), now, cfg, seededRng(1));
    if (!r.ok) throw new Error('expected questions');
    const count = (d: string) => r.questions.filter((q) => q.difficulty === d).length;
    expect([count('easy'), count('medium'), count('hard')]).toEqual([3, 4, 3]);
  });

  it('BR-13: never repeats a question seen in the last 90 days', () => {
    const seen = new Map(bank.slice(0, 30).map((q) => [q.id, '2026-09-01T00:00:00Z']));
    for (let seed = 0; seed < 20; seed++) {
      const r = selectQuestions(bank, seen, now, cfg, seededRng(seed));
      if (!r.ok) throw new Error('expected questions');
      expect(r.questions.every((q) => q.n >= 30)).toBe(true);
    }
    const old = new Map(bank.map((q) => [q.id, '2026-06-01T00:00:00Z']));
    expect(selectQuestions(bank, old, now, cfg, seededRng(2)).ok).toBe(true);
    const all = new Map(bank.map((q) => [q.id, '2026-10-01T00:00:00Z']));
    expect(selectQuestions(bank, all, now, cfg, seededRng(2))).toEqual({
      ok: false,
      reason: 'NOT_ENOUGH_QUESTIONS',
    });
  });

  it('BR-14: at most 2 sponsored questions per match', () => {
    const allSponsored = bank.map((q) => ({ ...q, sponsored: q.n < 45 }));
    for (let seed = 0; seed < 20; seed++) {
      const r = selectQuestions(allSponsored, new Map(), now, cfg, seededRng(seed));
      if (r.ok) expect(r.questions.filter((q) => q.sponsored).length).toBeLessThanOrEqual(2);
    }
  });

  it('skips drafts, retired and expired questions', () => {
    const mixed = bank.map((q) => ({
      ...q,
      status: q.n < 10 ? ('draft' as const) : q.status,
      expiresAt: q.n >= 10 && q.n < 20 ? '2026-10-01T00:00:00Z' : null,
    }));
    const r = selectQuestions(mixed, new Map(), now, cfg, seededRng(3));
    if (!r.ok) throw new Error('expected questions');
    expect(r.questions.every((q) => q.n >= 20)).toBe(true);
  });
});

describe('bots and fair play', () => {
  it('a bot never answers faster than the fair-play floor', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 500; i++) {
      const a = botAnswer(1400, 'easy', cfg, rng);
      if (a.latencyMs !== null) expect(a.latencyMs).toBeGreaterThanOrEqual(cfg.fairPlay.minHumanMs);
    }
  });

  it('flags more than 2 answers under 800 ms in a match', () => {
    expect(inhumanSpeedFlag([ans(true, 500), ans(true, 600), ans(true, 3000)], cfg)).toBe(false);
    expect(inhumanSpeedFlag([ans(true, 500), ans(true, 600), ans(true, 700)], cfg)).toBe(true);
  });
});

describe('prizes', () => {
  it('the default prize table is 10,000 down to 1,000 SAR = 55,000, in integer halalas', () => {
    expect(prizePoolHalalas(cfg.prizeTableHalalas)).toBe(5_500_000);
    expect(halalasToSar(5_500_000)).toBe('55,000');
    expect(halalasToSar(12_345)).toBe('123.45');
  });
});
