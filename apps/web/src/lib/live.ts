/**
 * The ranked match this page is running right now. Module state, so a refresh or a new tab starts with none and any
 * stored `activeRanked` is recognised as abandoned.
 */
export const live: { matchId: string | null } = { matchId: null };
