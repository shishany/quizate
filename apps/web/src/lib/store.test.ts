import { describe, expect, it } from 'vitest';
import type { AnswerRecord } from '@quizate/game';
import { initialState, SAMPLE_PLAYERS } from './sample';
import { settle, type SettleInput } from './settle';
import { reducer } from './store';
import type { DemoState, Player } from './types';

const player: Player = {
  id: 'me',
  name: 'Tester',
  phoneMasked: '+966 5•• ••• 123',
  birthDate: '1990-01-01',
  dobSource: 'declared',
  nationalIdMasked: null,
  identityVerifiedAt: null,
  iban: null,
  cityId: 'riyadh',
  rating: 1200,
  createdAt: '2026-10-01T00:00:00Z',
  consents: [],
};
const signedIn = (): DemoState =>
  reducer(initialState(new Date('2026-10-20T10:00:00Z')), { type: 'signIn', player });
const right = (n: number): AnswerRecord[] =>
  Array.from({ length: 10 }, (_, i) => ({
    option: i < n ? 0 : 1,
    correct: i < n,
    latencyMs: 3000,
  }));
const opp = SAMPLE_PLAYERS[0]!;

function match(state: DemoState, over: Partial<SettleInput> = {}): SettleInput {
  return {
    id: `m-${Math.random()}`,
    mode: 'ranked',
    at: '2026-10-20T10:00:00Z',
    questions: state.questions.filter((q) => q.status === 'published').slice(0, 10),
    mine: right(8),
    theirs: right(5),
    forfeit: false,
    opponent: { id: opp.id, name: opp.name, cityId: opp.cityId, band: 'saudi', rating: 1200 },
    ...over,
  };
}

describe('match settlement', () => {
  it('BR-01, BR-03, BR-04, BR-09: a ranked win scores, earns monthly points and rating', () => {
    const s = signedIn();
    const action = settle(s, match(s));
    expect(action.summary).toMatchObject({
      myScore: 80,
      opponentScore: 50,
      outcome: 'win',
      monthlyPoints: 80,
      counted: true,
      ratingAfter: 1212,
    });
    const next = reducer(s, action);
    expect(next.myResults).toHaveLength(1);
    expect(next.player?.rating).toBe(1212);
    expect(Object.keys(next.seen)).toHaveLength(10);
  });

  it('BR-05: matches beyond the monthly cap still change rating but earn no points', () => {
    let s = signedIn();
    s = reducer(s, { type: 'config', key: 'monthlyCap', value: 1, reason: 'x' }); // not super admin: ignored
    expect(s.config.monthlyCap).toBe(60);
    s = reducer(reducer(s, { type: 'adminSignIn', role: 'super_admin' }), {
      type: 'config',
      key: 'monthlyCap',
      value: 1,
      reason: 'beta tuning',
    });
    s = reducer(s, settle(s, match(s)));
    const second = settle(s, match(s, { at: '2026-10-20T11:00:00Z' }));
    expect(second.summary).toMatchObject({ counted: false, monthlyPoints: 0 });
    expect(second.summary.ratingAfter).not.toBe(second.summary.ratingBefore);
  });

  it('FR-09: practice never changes monthly points or rating, and does not mark questions as seen', () => {
    const s = signedIn();
    const action = settle(s, match(s, { mode: 'practice' }));
    expect(action.summary).toMatchObject({ monthlyPoints: 0, ratingAfter: 1200 });
    expect(action.ranked).toBeUndefined();
    expect(action.seenIds).toEqual([]);
  });

  it('BR-11: leaving a ranked match is a loss and is recorded as an abandon', () => {
    const s = signedIn();
    const action = settle(s, match(s, { forfeit: true, mine: right(9) }));
    expect(action.summary.outcome).toBe('loss');
    expect(reducer(s, action).abandons).toHaveLength(1);
  });

  it('BR-11: a ranked match left behind (refresh, closed tab) is settled as a forfeit', () => {
    let s = signedIn();
    s = reducer(s, {
      type: 'rankedStart',
      active: {
        id: 'm-x',
        at: '2026-10-20T10:00:00Z',
        opponent: { id: opp.id, name: opp.name, cityId: opp.cityId, band: 'saudi', rating: 1200 },
        ratingBefore: 1200,
      },
    });
    s = reducer(s, { type: 'rankedForfeitStale' });
    expect(s.activeRanked).toBeNull();
    expect(s.matches[0]).toMatchObject({ id: 'm-x', forfeit: true, outcome: 'loss' });
    expect(s.abandons).toHaveLength(1);
  });

  it('flags answers faster than the human floor for review, without blocking the player', () => {
    const s = signedIn();
    const fast = right(10).map((a) => ({ ...a, latencyMs: 300 }));
    const next = reducer(s, settle(s, match(s, { mine: fast })));
    expect(next.fraud[0]).toMatchObject({
      playerIds: ['me'],
      signal: 'inhuman_speed',
      status: 'open',
    });
    expect(next.myResults).toHaveLength(1);
  });
});

describe('admin actions', () => {
  it('FR-13: an author cannot review their own question (two-person rule)', () => {
    let s = reducer(signedIn(), { type: 'adminSignIn', role: 'content_editor' });
    s = reducer(s, {
      type: 'questionDraft',
      question: {
        id: 'q-new',
        category: 'general',
        difficulty: 'easy',
        text: { ar: 'س', en: 'Q' },
        options: [
          { ar: 'أ', en: 'A' },
          { ar: 'ب', en: 'B' },
          { ar: 'ج', en: 'C' },
          { ar: 'د', en: 'D' },
        ],
        expiresAt: null,
        sponsored: false,
        campaignId: null,
      },
    });
    s = reducer(s, { type: 'question', id: 'q-new', action: 'submitted' });
    expect(s.questions.find((q) => q.id === 'q-new')?.status).toBe('in_review');
    s = reducer(s, { type: 'question', id: 'q-new', action: 'approved' });
    expect(s.questions.find((q) => q.id === 'q-new')?.status).toBe('in_review');
    s = reducer(reducer(s, { type: 'adminSignOut' }), {
      type: 'adminSignIn',
      role: 'content_reviewer',
    });
    s = reducer(s, { type: 'question', id: 'q-new', action: 'approved' });
    expect(s.questions.find((q) => q.id === 'q-new')).toMatchObject({
      status: 'published',
      reviewerId: 'adm-khalid',
    });
    expect(s.audit.map((a) => a.action)).toContain('question.approved');
  });

  it('FR-27: a configuration change needs the super admin and a reason, and is audited', () => {
    let s = reducer(signedIn(), { type: 'adminSignIn', role: 'super_admin' });
    s = reducer(s, { type: 'config', key: 'dailyRankedLimit', value: 12, reason: '  ' });
    expect(s.config.dailyRankedLimit).toBe(10);
    s = reducer(s, { type: 'config', key: 'dailyRankedLimit', value: 12, reason: 'Beta week 2' });
    expect(s.config.dailyRankedLimit).toBe(12);
    expect(s.configHistory[0]).toMatchObject({
      key: 'dailyRankedLimit',
      from: '10',
      to: '12',
      reason: 'Beta week 2',
    });
    expect(s.audit[0]).toMatchObject({ action: 'config.change', before: '10', after: '12' });
  });

  it('FR-26: a fraud decision needs a fraud analyst (or super admin) and a reason', () => {
    let s = reducer(signedIn(), { type: 'adminSignIn', role: 'content_editor' });
    s = reducer(s, { type: 'fraud', id: 'ff-1', status: 'suspended', reason: 'x' });
    expect(s.fraud.find((f) => f.id === 'ff-1')?.status).toBe('open');
    s = reducer(reducer(s, { type: 'adminSignOut' }), {
      type: 'adminSignIn',
      role: 'fraud_analyst',
    });
    s = reducer(s, { type: 'fraud', id: 'ff-1', status: 'warned', reason: 'First offence' });
    expect(s.fraud.find((f) => f.id === 'ff-1')).toMatchObject({
      status: 'warned',
      decision: { reason: 'First offence' },
    });
  });

  it('the prize flag cannot be reached through configuration', () => {
    const s = initialState();
    expect(JSON.stringify(s.config)).not.toMatch(/enabled/);
  });
});

describe('FR-30 engagement', () => {
  it('rule 10: XP from a ranked match never changes monthly points', () => {
    const s = signedIn();
    const action = settle(s, match(s));
    expect(action.xp?.amount).toBe(20 + 2 * 8 + 15);
    const next = reducer(s, action);
    expect(next.xp).toHaveLength(1);
    expect(next.myResults[0]?.score).toBe(80);
    expect(action.summary.monthlyPoints).toBe(80);
  });

  it('practice XP stops at the daily cap of 200', () => {
    let s = signedIn();
    for (let k = 0; k < 25; k++)
      s = reducer(s, settle(s, match(s, { mode: 'practice', id: `p${k}` })));
    expect(s.xp.reduce((t, e) => t + e.amount, 0)).toBe(200);
  });

  it('a forfeit earns no XP and does not count as an active day', () => {
    const s = signedIn();
    const next = reducer(s, settle(s, match(s, { forfeit: true })));
    expect(next.xp).toHaveLength(0);
    expect(next.activeDays).toHaveLength(0);
  });

  it('daily claim pays once a day, in coins and XP', () => {
    let s = reducer(signedIn(), { type: 'claimDaily' });
    s = reducer(s, { type: 'claimDaily' });
    expect(s.coins).toHaveLength(1);
    expect(s.lastClaim?.index).toBe(0);
  });

  it('a mission can only be claimed once its target is met', () => {
    const s = signedIn();
    const before = reducer(s, { type: 'claimMission', id: 'mirror' });
    expect(before.missionClaims).toHaveLength(0);
  });

  it('partner gifts on the road are shown but never granted; coins are', () => {
    let s = signedIn();
    s = reducer(s, { type: 'claimRoad', nodeId: 'capable-3' });
    expect(s.coins.reduce((t, e) => t + e.amount, 0)).toBe(100);
    expect(s.cosmetics).toHaveLength(0);
    s = reducer(s, { type: 'claimRoad', nodeId: 'capable-3' });
    expect(s.coins).toHaveLength(1);
  });

  it('FR-04: only the super admin changes when the IBAN is required, with a reason', () => {
    let s = reducer(signedIn(), { type: 'ibanRequiredAt', value: 'ranked', reason: 'x' });
    expect(s.ibanRequiredAt).toBe('prize');
    s = reducer(reducer(s, { type: 'adminSignIn', role: 'super_admin' }), {
      type: 'ibanRequiredAt',
      value: 'ranked',
      reason: 'Completion below 60%',
    });
    expect(s.ibanRequiredAt).toBe('ranked');
    expect(s.audit[0]).toMatchObject({
      entity: 'identity.iban_required_at',
      before: 'prize',
      after: 'ranked',
    });
  });
});

describe('accounts on this device', () => {
  it('signing out keeps the account so the player can sign in again', () => {
    let s = signedIn();
    s = reducer(s, { type: 'signOut' });
    expect(s.player).toBeNull();
    expect(s.savedAccount?.name).toBe('Tester');
    s = reducer(s, { type: 'restoreAccount' });
    expect(s.player?.name).toBe('Tester');
  });

  it('image questions are in the bank, and brand logo questions are sponsored', () => {
    const s = initialState();
    const images = s.questions.filter((q) => q.image);
    expect(images.filter((q) => q.image?.startsWith('flag-')).length).toBeGreaterThanOrEqual(5);
    expect(
      images.filter((q) => q.image?.startsWith('logo-')).every((q) => q.sponsored && q.campaignId),
    ).toBe(true);
  });
});

describe('mobile sign-up, Nafath for payments (owner decision, 2026-10-30)', () => {
  it('a mobile-only player plays; the IBAN waits for a Nafath-verified identity', () => {
    let s = signedIn();
    expect(s.ibanRequiredAt).toBe('prize');
    s = reducer(s, { type: 'setIban', masked: 'SA12 •••• •••• •••• 3456' });
    expect(s.player?.iban).toBeNull();
    s = reducer(s, {
      type: 'verifyIdentity',
      nationalIdMasked: '1•••••••78',
      birthDate: '1990-05-01',
    });
    expect(s.player).toMatchObject({
      dobSource: 'nafath',
      nationalIdMasked: '1•••••••78',
      birthDate: '1990-05-01',
    });
    s = reducer(s, { type: 'setIban', masked: 'SA12 •••• •••• •••• 3456' });
    expect(s.player?.iban?.masked).toBe('SA12 •••• •••• •••• 3456');
  });
});
