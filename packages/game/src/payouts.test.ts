import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG as cfg } from './config.js';
import { collusionAlerts } from './fairplay.js';
import { monthlyRating, standingFor } from './monthly.js';
import {
  canMarkPaid,
  monthlyPoolHalalas,
  payoutQueue,
  prizePoolHalalas,
  scaledPrizeTable,
  type PayoutCheck,
} from './prizes.js';

describe('prizes and fair play (CR v3 section 9)', () => {
  const table = cfg.prizeTableHalalas;

  it('prize table totals SAR 16,500', () => {
    expect(table.map((h) => h / 100)).toEqual([5000, 4000, 3000, 2000, 1000, 500, 400, 300, 200, 100]);
    expect(prizePoolHalalas(table)).toBe(1_650_000);
  });

  it('pool = min(16,500, sponsor funding); ranks scale and round down to SAR 10', () => {
    expect(monthlyPoolHalalas(table, 3_000_000)).toBe(1_650_000);
    expect(monthlyPoolHalalas(table, 825_000)).toBe(825_000);
    expect(scaledPrizeTable(table, 1_650_000)).toEqual(table);
    const half = scaledPrizeTable(table, 825_000).map((h) => h / 100);
    expect(half).toEqual([2500, 2000, 1500, 1000, 500, 250, 200, 150, 100, 50]);
    const odd = scaledPrizeTable(table, 1_000_000).map((h) => h / 100);
    expect(odd[0]).toBe(3030); // 5000 x 10000/16500 = 3030.30 -> 3030
    expect(odd.every((x) => x % 10 === 0)).toBe(true);
  });

  it('queue at month close: top 10 with >= 60 matches and 18+ by DOB, each id_check_pending', () => {
    const close = new Date('2026-11-30T21:00:00Z');
    const ranking = [
      { playerId: 'p1', qualified: true, birthDate: '1990-01-01' },
      { playerId: 'kid', qualified: true, birthDate: '2010-05-05' },
      { playerId: 'few', qualified: false, birthDate: '1990-01-01' },
      ...Array.from({ length: 12 }, (_, i) => ({ playerId: `a${i}`, qualified: true, birthDate: '1995-03-03' })),
    ];
    const { places, log } = payoutQueue(ranking, new Map(), table, close);
    expect(places).toHaveLength(10);
    expect(places.map((p) => p.playerId).slice(0, 3)).toEqual(['p1', 'a0', 'a1']);
    expect(places.every((p) => p.status === 'id_check_pending')).toBe(true);
    expect(places[0]?.amountHalalas).toBe(500_000);
    expect(log).toEqual([{ playerId: 'kid', reason: 'under_18_by_dob', place: null }]);
  });

  it('a passed check makes the place cash eligible, then payable; a failed one passes the place on and logs it', () => {
    const close = new Date('2026-11-30T21:00:00Z');
    const ranking = Array.from({ length: 12 }, (_, i) => ({ playerId: `a${i}`, qualified: true, birthDate: '1995-03-03' }));
    const checks = new Map<string, PayoutCheck>([
      ['a0', { result: 'passed' }],
      ['a1', { result: 'failed', failure: 'iban_name_mismatch' }],
      ['a2', { result: 'failed', failure: 'under_18' }],
      ['a3', { result: 'passed', paid: true }],
    ]);
    const { places, log } = payoutQueue(ranking, checks, table, close);
    expect(places[0]).toMatchObject({ playerId: 'a0', status: 'cash_eligible' });
    expect(canMarkPaid(places[0]!)).toBe(true);
    expect(places[1]).toMatchObject({ place: 2, playerId: 'a3', status: 'paid', amountHalalas: 400_000 });
    expect(canMarkPaid(places[1]!)).toBe(false);
    expect(canMarkPaid(places[2]!)).toBe(false); // id_check_pending
    expect(places.map((p) => p.playerId)).toEqual(['a0', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 'a10', 'a11']);
    expect(log).toEqual([
      { playerId: 'a1', reason: 'iban_name_mismatch', place: 2 },
      { playerId: 'a2', reason: 'under_18', place: 2 },
    ]);
  });

  it('flags the same pair with >= 3 matches in 7 days and the same winner every time', () => {
    const day = (n: number) => new Date(Date.UTC(2026, 10, 10 + n, 18)).toISOString();
    const three = [0, 2, 5].map((n) => ({ at: day(n), playerA: 'a', playerB: 'b', winner: 'b' }));
    expect(collusionAlerts(three, cfg)).toEqual([
      { pair: ['a', 'b'], matches: 3, dominant: 'b', from: day(0), to: day(5) },
    ]);
    expect(collusionAlerts(three.slice(0, 2), cfg)).toEqual([]);
    expect(collusionAlerts(three.map((m, i) => ({ ...m, winner: i === 1 ? 'a' : 'b' })), cfg)).toEqual([]);
    expect(collusionAlerts(three.map((m, i) => ({ ...m, winner: i === 1 ? null : 'b' })), cfg)).toEqual([]);
    const spread = [0, 4, 8].map((n) => ({ at: day(n), playerA: 'a', playerB: 'b', winner: 'b' }));
    expect(collusionAlerts(spread, cfg)).toEqual([]);
  });

  it('challenge-a-friend matches count for no rating, qualification, points or prizes', () => {
    const at = (i: number) => new Date(Date.UTC(2026, 10, 1, 9, i)).toISOString();
    const base = { opponentId: 'o', outcome: 'win' as const, score: 90, correct: 9, questions: 10, latencyTotalMs: 20_000, answered: 10 };
    const sixty = Array.from({ length: 60 }, (_, i) => ({ ...base, matchId: `m${i}`, at: at(i) }));
    const friends = sixty.map((r) => ({ ...r, friend: true }));
    expect(monthlyRating(friends, '2026-11', cfg).rating).toBe(1000);
    const s = standingFor('p', friends, '2026-11', cfg);
    expect(s).toMatchObject({ points: 0, qualifyingMatches: 0, eligible: false, rating: 1000 });
    expect(standingFor('p', [...sixty, ...friends], '2026-11', cfg).qualifyingMatches).toBe(60);
  });
});
