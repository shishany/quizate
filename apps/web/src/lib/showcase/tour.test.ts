import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SHOWCASE_STRINGS } from './i18n';
import { TOUR_STEPS } from './tour';

const SRC = join(__dirname, '..', '..');
const PAGE: Record<string, string[]> = {
  '/showcase': [
    'app/showcase/page.tsx',
    'components/showcase/Live.tsx',
    'components/showcase/Roadmap.tsx',
  ],
  '/showcase/sponsor': ['app/showcase/sponsor/page.tsx'],
  '/showcase/impact': ['app/showcase/impact/page.tsx'],
};

describe('showcase tour', () => {
  it('has six steps in the agreed order', () => {
    expect(TOUR_STEPS.map((s) => s.id)).toEqual([
      'player',
      'match',
      'sponsor',
      'prizes',
      'impact',
      'roadmap',
    ]);
  });
  it('every target is marked on its page, and every step has text in both languages', () => {
    for (const step of TOUR_STEPS) {
      const files = PAGE[step.path] ?? [];
      const found = files.some((f) =>
        readFileSync(join(SRC, f), 'utf8').includes(`data-tour="${step.target}"`),
      );
      expect(found, step.id).toBe(true);
      expect(SHOWCASE_STRINGS.ar.tour.steps[step.id][0]).toBeTruthy();
      expect(SHOWCASE_STRINGS.en.tour.steps[step.id][0]).toBeTruthy();
    }
  });
});
