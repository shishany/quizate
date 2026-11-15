import { describe, expect, it } from 'vitest';
import { boardBadges } from './board.js';

describe('leaderboard badges (CR v3 section 6)', () => {
  it('prize zone = top 10 qualified cash-eligible; youth badge = top qualified youth', () => {
    const rows = [
      {
        playerId: 'y1',
        eligible: true,
        cashEligible: false,
        ageGroup: 'youth' as const,
        qualifyingMatches: 30,
      },
      {
        playerId: 'a1',
        eligible: true,
        cashEligible: true,
        ageGroup: 'adult' as const,
        qualifyingMatches: 60,
      },
      {
        playerId: 'a2',
        eligible: false,
        cashEligible: true,
        ageGroup: 'adult' as const,
        qualifyingMatches: 60,
      },
      {
        playerId: 'a3',
        eligible: true,
        cashEligible: false,
        ageGroup: 'adult' as const,
        qualifyingMatches: 60,
      },
      {
        playerId: 'a4',
        eligible: true,
        cashEligible: true,
        ageGroup: 'adult' as const,
        qualifyingMatches: 60,
      },
      {
        playerId: 'y2',
        eligible: true,
        cashEligible: false,
        ageGroup: 'youth' as const,
        qualifyingMatches: 30,
      },
    ];
    const b = boardBadges(rows, 10, 1, 30);
    expect(b.get('a1')).toEqual({ prizeZone: 1, youthTop: null });
    expect(b.get('a2')?.prizeZone).toBeNull();
    expect(b.get('a3')?.prizeZone).toBeNull();
    expect(b.get('a4')?.prizeZone).toBe(2);
    expect(b.get('y1')).toEqual({ prizeZone: null, youthTop: 1 });
    expect(b.get('y2')?.youthTop).toBeNull();
  });

  it('youth award: top 3 youth with >= 30 matches (adults still need 60 for prizes)', () => {
    const y = (id: string, n: number) => ({
      playerId: id,
      eligible: false,
      cashEligible: false,
      ageGroup: 'youth' as const,
      qualifyingMatches: n,
    });
    const b = boardBadges(
      [y('y1', 45), y('y2', 29), y('y3', 30), y('y4', 31), y('y5', 40)],
      10,
      3,
      30,
    );
    expect([...b].filter(([, v]) => v.youthTop).map(([k, v]) => `${k}:${v.youthTop}`)).toEqual([
      'y1:1',
      'y3:2',
      'y4:3',
    ]);
    expect(b.get('y2')?.youthTop).toBeNull();
  });
});
