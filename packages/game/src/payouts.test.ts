import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG as cfg } from './config.js';
import { collusionAlerts } from './fairplay.js';
import { canMovePayout, monthlyPoolHalalas, prizePoolHalalas, scaledPrizeTable } from './prizes.js';

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

  it('a payout is marked paid only after the ID and IBAN-name checks', () => {
    const none = { idChecked: false, ibanNameMatches: false };
    const both = { idChecked: true, ibanNameMatches: true };
    expect(canMovePayout('pending_review', 'approved', none)).toBe(false);
    expect(canMovePayout('pending_review', 'paid', both)).toBe(false);
    expect(canMovePayout('pending_review', 'approved', both)).toBe(true);
    expect(canMovePayout('approved', 'paid', both)).toBe(true);
    expect(canMovePayout('pending_review', 'rejected', none)).toBe(true);
  });

  it('flags the same pair with >= 5 matches in 24 h and a one-sided result', () => {
    const at = (h: number) => new Date(Date.UTC(2026, 10, 10, h)).toISOString();
    const five = [1, 2, 3, 4, 5].map((h) => ({ at: at(h), playerA: 'a', playerB: 'b', winner: 'a' }));
    expect(collusionAlerts(five, cfg)).toEqual([
      { pair: ['a', 'b'], matches: 5, dominant: 'a', from: at(1), to: at(5) },
    ]);
    const mixed = five.map((m, i) => ({ ...m, winner: i < 3 ? 'a' : 'b' }));
    expect(collusionAlerts(mixed, cfg)).toEqual([]);
    const spread = five.map((m, i) => ({ ...m, at: new Date(Date.UTC(2026, 10, 10 + i)).toISOString() }));
    expect(collusionAlerts(spread, cfg)).toEqual([]);
  });
});
