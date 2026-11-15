import { describe, expect, it } from 'vitest';
import { seededRng } from '@quizate/game';
import { boardOf, initialSim, stepSim } from './sim';

describe('showcase simulation', () => {
  it('is seeded and deterministic', () => {
    expect(initialSim(seededRng(1), 12)).toEqual(initialSim(seededRng(1), 12));
  });
  it('each step adds a feed item, grows counters and keeps the rating sum (Elo is zero-sum)', () => {
    const rng = seededRng(5);
    let s = initialSim(rng, 12);
    const sum = s.players.reduce((t, p) => t + p.rating, 0);
    const before = s.counters.matchesToday;
    for (let i = 0; i < 20; i++) s = stepSim(s, rng);
    expect(s.feed).toHaveLength(8);
    expect(s.feed[0]?.id).toBe(20);
    expect(s.counters.matchesToday).toBeGreaterThan(before);
    expect(s.players.reduce((t, p) => t + p.rating, 0)).toBe(sum);
    expect(s.feed.every((f) => f.winnerId !== f.loserId)).toBe(true);
    const board = boardOf(s);
    expect(board[0]!.rating).toBeGreaterThanOrEqual(board[board.length - 1]!.rating);
  });
});
