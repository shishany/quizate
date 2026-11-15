import { describe, expect, it } from 'vitest';
import { MATCH_CATEGORIES, questionsInCategory } from './categories.js';

describe('categories (CR v3 section 4)', () => {
  it('seeds the six categories with Mixed first', () => {
    expect(MATCH_CATEGORIES.map((c) => c.id)).toEqual([
      'mixed',
      'history',
      'geography',
      'literature',
      'science',
      'sport',
    ]);
  });
  it('Mixed means all categories; others filter', () => {
    const bank = [{ category: 'history' }, { category: 'sports' }, { category: 'general' }];
    expect(questionsInCategory(bank, 'mixed')).toHaveLength(3);
    expect(questionsInCategory(bank, 'sport')).toEqual([{ category: 'sports' }]);
    expect(questionsInCategory(bank, 'literature')).toEqual([]);
  });
});
