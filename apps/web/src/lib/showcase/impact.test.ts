import { describe, expect, it } from 'vitest';
import { seededRng } from '@quizate/game';
import { impactOf } from './impact';
import { initialSim, stepSim } from './sim';

describe('showcase impact', () => {
  it('reads reach, youth and category shares from the simulation', () => {
    const rng = seededRng(3);
    let sim = initialSim(rng, 18);
    for (let i = 0; i < 5; i++) sim = stepSim(sim, rng);
    const im = impactOf(sim);
    expect(im.questionsAnswered).toBe(sim.counters.questionsAnswered);
    expect(im.cities).toBe(10);
    expect(im.youthEngaged).toBeGreaterThan(0);
    expect(im.youthEngaged).toBeLessThan(im.playersReached);
    expect(im.byCategory.map((c) => c.id)).not.toContain('mixed');
    expect(im.byCategory.reduce((t, c) => t + c.share, 0)).toBeCloseTo(1);
  });
});
