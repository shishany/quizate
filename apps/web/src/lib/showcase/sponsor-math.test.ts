import { describe, expect, it } from 'vitest';
import { attentionSeconds, poolShareOf, sponsorCalc, traditionalSeconds } from './sponsor-math';

describe('showcase sponsor maths', () => {
  it('10 s of attention per view against about 2 s for a traditional ad', () => {
    expect(attentionSeconds(1000)).toBe(10_000);
    expect(traditionalSeconds(1000)).toBe(2_000);
  });
  it('calculator: questions per match x daily players x 30 days, then views/1000 x price', () => {
    const r = sponsorCalc({ questionsPerMatch: 2, dailyPlayers: 5000, pricePer1000Halalas: 4000 });
    expect(r.monthlyViews).toBe(300_000);
    expect(r.monthlyHalalas).toBe(1_200_000); // SAR 12,000
    expect(r.poolShare).toBeCloseTo(12_000 / 16_500);
  });
  it('pool share is capped at the whole pool', () => {
    expect(poolShareOf(5_000_000)).toBe(1);
  });
});
