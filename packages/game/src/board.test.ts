import { describe, expect, it } from 'vitest';
import { boardBadges } from './board.js';

describe('leaderboard badges (CR v3 section 6)', () => {
  it('prize zone = top 10 qualified cash-eligible; youth badge = top qualified youth', () => {
    const rows = [
      { playerId: 'y1', eligible: true, cashEligible: false, ageGroup: 'youth' as const },
      { playerId: 'a1', eligible: true, cashEligible: true, ageGroup: 'adult' as const },
      { playerId: 'a2', eligible: false, cashEligible: true, ageGroup: 'adult' as const },
      { playerId: 'a3', eligible: true, cashEligible: false, ageGroup: 'adult' as const },
      { playerId: 'a4', eligible: true, cashEligible: true, ageGroup: 'adult' as const },
      { playerId: 'y2', eligible: true, cashEligible: false, ageGroup: 'youth' as const },
    ];
    const b = boardBadges(rows, 10, 1);
    expect(b.get('a1')).toEqual({ prizeZone: 1, youthTop: null });
    expect(b.get('a2')?.prizeZone).toBeNull();
    expect(b.get('a3')?.prizeZone).toBeNull();
    expect(b.get('a4')?.prizeZone).toBe(2);
    expect(b.get('y1')).toEqual({ prizeZone: null, youthTop: 1 });
    expect(b.get('y2')?.youthTop).toBeNull();
  });
});
