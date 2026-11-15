/** Guided tour of /showcase: six steps, each a page and the element it highlights (`data-tour`). */
export const TOUR_STEPS = [
  { id: 'player', path: '/showcase', target: 'player' },
  { id: 'match', path: '/showcase', target: 'match' },
  { id: 'sponsor', path: '/showcase/sponsor', target: 'sponsor' },
  { id: 'prizes', path: '/showcase/sponsor', target: 'prizes' },
  { id: 'impact', path: '/showcase/impact', target: 'impact' },
  { id: 'roadmap', path: '/showcase', target: 'roadmap' },
] as const;

export type TourStepId = (typeof TOUR_STEPS)[number]['id'];
