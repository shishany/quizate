'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import { riyadhMonthKey, updateRatings, type GameConfig, type RankedResult } from '@quizate/game';
import { ADMIN_USERS, STATE_VERSION, STORAGE_KEY, initialState } from './sample';
import type {
  AdminRole,
  AuditEntry,
  DemoState,
  FraudStatus,
  Locale,
  MatchSummary,
  Player,
  Question,
  QuestionAction,
} from './types';

export type Action =
  | { type: 'hydrate'; state: DemoState }
  | { type: 'locale'; locale: Locale }
  | { type: 'reset' }
  | { type: 'signIn'; player: Player }
  | { type: 'signOut' }
  | {
      type: 'matchFinished';
      summary: MatchSummary;
      ranked?: RankedResult;
      seenIds?: string[];
      abandoned?: boolean;
      flag?: { evidence: { ar: string; en: string } };
      sponsored?: { shown: number; answered: number; correct: number };
    }
  | { type: 'rankedStart'; active: NonNullable<DemoState['activeRanked']> }
  | { type: 'rankedForfeitStale' }
  | { type: 'speedBest'; score: number }
  | { type: 'follow'; id: string }
  | { type: 'adminSignIn'; role: AdminRole }
  | { type: 'adminSignOut' }
  | { type: 'question'; id: string; action: QuestionAction; reason?: string }
  | {
      type: 'questionDraft';
      question: Omit<
        Question,
        'history' | 'version' | 'authorId' | 'reviewerId' | 'reports' | 'status'
      >;
    }
  | { type: 'config'; key: ConfigKey; value: number; reason: string }
  | { type: 'fraud'; id: string; status: FraudStatus; reason: string };

/** Editable configuration keys (FR-27), each a number at a path in GameConfig. */
export type ConfigKey =
  | 'pointsPerCorrect'
  | 'questionSeconds'
  | 'monthlyShare.win'
  | 'monthlyShare.loss'
  | 'monthlyShare.draw'
  | 'monthlyCap'
  | 'dailyRankedLimit'
  | 'samePair.per24h'
  | 'samePair.perMonth'
  | 'eligibility.minMatches'
  | 'eligibility.minOpponents'
  | 'rating.k'
  | 'abandon.graceSeconds'
  | 'abandon.blockAfter'
  | 'questionRepeatDays'
  | 'maxSponsored'
  | 'fairPlay.minHumanMs'
  | 'speedRound.seconds';

export function readConfig(cfg: GameConfig, key: ConfigKey): number {
  return key
    .split('.')
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], cfg) as number;
}

function writeConfig(cfg: GameConfig, key: ConfigKey, value: number): GameConfig {
  const next = structuredClone(cfg);
  const parts = key.split('.');
  const last = parts.pop() as string;
  const parent = parts.reduce<Record<string, unknown>>(
    (node, part) => node[part] as Record<string, unknown>,
    next as unknown as Record<string, unknown>,
  );
  parent[last] = value;
  return next;
}

/** Ranked matches already played in the Riyadh month of `at` (BR-05 cap check). */
export function countedThisMonth(state: DemoState, at: string): number {
  const month = riyadhMonthKey(at);
  return state.myResults.filter((r) => riyadhMonthKey(r.at) === month).length;
}

let auditSeq = 0;
function audit(
  state: DemoState,
  action: string,
  entity: string,
  reason: string | null,
  extra: Partial<AuditEntry> = {},
): AuditEntry[] {
  const actor = state.adminRole ? ADMIN_USERS[state.adminRole].id : 'system';
  auditSeq += 1;
  return [
    {
      id: `au-${Date.now()}-${auditSeq}`,
      at: new Date().toISOString(),
      actor,
      action,
      entity,
      reason,
      ...extra,
    },
    ...state.audit,
  ];
}

/** Which question actions each role may take, and from which status. Two-person rule: the author never reviews. */
export function questionActionAllowed(
  state: DemoState,
  q: Question,
  action: QuestionAction,
): boolean {
  const role = state.adminRole;
  if (!role) return false;
  const me = ADMIN_USERS[role].id;
  const editor = role === 'content_editor' || role === 'super_admin';
  const reviewer = role === 'content_reviewer' || role === 'super_admin';
  switch (action) {
    case 'submitted':
      return editor && q.status === 'draft';
    case 'approved':
    case 'rejected':
      return reviewer && q.status === 'in_review' && q.authorId !== me;
    case 'retired':
    case 'voided':
      return reviewer && q.status === 'published';
    default:
      return false;
  }
}

export function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'locale':
      return { ...state, locale: action.locale };
    case 'reset':
      return { ...initialState(), locale: state.locale };
    case 'signIn':
      return { ...state, player: action.player };
    case 'signOut':
      return { ...state, player: null };
    case 'matchFinished': {
      const { summary, ranked, seenIds = [], abandoned, flag, sponsored } = action;
      const seen = { ...state.seen };
      for (const id of seenIds) seen[id] = summary.at;
      const player = state.player ? { ...state.player, rating: summary.ratingAfter } : null;
      const fraud =
        flag && player
          ? [
              {
                id: `ff-${summary.id}`,
                at: summary.at,
                playerIds: [player.id],
                signal: 'inhuman_speed' as const,
                risk: 70,
                status: 'open' as const,
                evidence: flag.evidence,
              },
              ...state.fraud,
            ]
          : state.fraud;
      const tally = sponsored
        ? {
            impressions: state.sponsorTally.impressions + sponsored.shown,
            answers: state.sponsorTally.answers + sponsored.answered,
            correct: state.sponsorTally.correct + sponsored.correct,
          }
        : state.sponsorTally;
      return {
        ...state,
        player,
        matches: [summary, ...state.matches],
        myResults: ranked ? [...state.myResults, ranked] : state.myResults,
        seen,
        abandons: abandoned ? [...state.abandons, summary.at] : state.abandons,
        fraud,
        sponsorTally: tally,
        activeRanked: state.activeRanked?.id === summary.id ? null : state.activeRanked,
      };
    }
    case 'rankedStart':
      return { ...state, activeRanked: action.active };
    case 'rankedForfeitStale': {
      const a = state.activeRanked;
      if (!a || !state.player) return { ...state, activeRanked: null };
      const counted = countedThisMonth(state, a.at) < state.config.monthlyCap;
      const { a: ratingAfter } = updateRatings(
        a.ratingBefore,
        a.opponent.rating,
        'loss',
        state.config,
      );
      const summary: MatchSummary = {
        id: a.id,
        mode: 'ranked',
        at: a.at,
        opponent: a.opponent,
        myScore: 0,
        opponentScore: null,
        outcome: 'loss',
        correct: 0,
        questions: state.config.questionsPerMatch,
        monthlyPoints: 0,
        counted,
        ratingBefore: a.ratingBefore,
        ratingAfter,
        forfeit: true,
      };
      const ranked: RankedResult = {
        matchId: a.id,
        at: a.at,
        opponentId: a.opponent.id,
        outcome: 'loss',
        score: 0,
        correct: 0,
        questions: state.config.questionsPerMatch,
        latencyTotalMs: 0,
        answered: 0,
      };
      return reducer({ ...state }, { type: 'matchFinished', summary, ranked, abandoned: true });
    }
    case 'speedBest':
      return { ...state, speedBest: Math.max(state.speedBest, action.score) };
    case 'follow':
      return {
        ...state,
        following: state.following.includes(action.id)
          ? state.following.filter((f) => f !== action.id)
          : [...state.following, action.id],
      };
    case 'adminSignIn':
      return {
        ...state,
        adminRole: action.role,
        audit: audit({ ...state, adminRole: action.role }, 'admin.sign_in', action.role, null),
      };
    case 'adminSignOut':
      return { ...state, adminRole: null };
    case 'question': {
      const q = state.questions.find((x) => x.id === action.id);
      if (!q || !state.adminRole || !questionActionAllowed(state, q, action.action)) return state;
      const actor = ADMIN_USERS[state.adminRole].id;
      const at = new Date().toISOString();
      const status: Question['status'] =
        action.action === 'submitted'
          ? 'in_review'
          : action.action === 'approved'
            ? 'published'
            : action.action === 'rejected'
              ? 'draft'
              : 'retired';
      const updated: Question = {
        ...q,
        status,
        reviewerId: action.action === 'approved' ? actor : q.reviewerId,
        history: [...q.history, { at, actor, action: action.action, version: q.version }],
      };
      return {
        ...state,
        questions: state.questions.map((x) => (x.id === q.id ? updated : x)),
        audit: audit(state, `question.${action.action}`, q.id, action.reason ?? null, {
          before: q.status,
          after: status,
        }),
      };
    }
    case 'questionDraft': {
      if (!state.adminRole) return state;
      const actor = ADMIN_USERS[state.adminRole].id;
      const at = new Date().toISOString();
      const q: Question = {
        ...action.question,
        status: 'draft',
        version: 1,
        authorId: actor,
        reviewerId: null,
        reports: 0,
        history: [{ at, actor, action: 'created', version: 1 }],
      };
      return {
        ...state,
        questions: [q, ...state.questions],
        audit: audit(state, 'question.created', q.id, null),
      };
    }
    case 'config': {
      if (state.adminRole !== 'super_admin' || !action.reason.trim()) return state;
      const from = readConfig(state.config, action.key);
      if (from === action.value) return state;
      const actor = ADMIN_USERS.super_admin.id;
      return {
        ...state,
        config: writeConfig(state.config, action.key, action.value),
        configHistory: [
          {
            at: new Date().toISOString(),
            actor,
            key: action.key,
            from: String(from),
            to: String(action.value),
            reason: action.reason,
          },
          ...state.configHistory,
        ],
        audit: audit(state, 'config.change', action.key, action.reason, {
          before: String(from),
          after: String(action.value),
        }),
      };
    }
    case 'fraud': {
      const f = state.fraud.find((x) => x.id === action.id);
      if (
        !f ||
        !state.adminRole ||
        !['super_admin', 'fraud_analyst'].includes(state.adminRole) ||
        !action.reason.trim()
      )
        return state;
      const actor = ADMIN_USERS[state.adminRole].id;
      const updated = {
        ...f,
        status: action.status,
        decision: { at: new Date().toISOString(), actor, reason: action.reason },
      };
      return {
        ...state,
        fraud: state.fraud.map((x) => (x.id === f.id ? updated : x)),
        audit: audit(state, `fraud.${action.status}`, f.id, action.reason, {
          before: f.status,
          after: action.status,
        }),
      };
    }
  }
}

function load(): DemoState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: start from the sample.
  }
  return initialState();
}

interface StoreValue {
  state: DemoState;
  dispatch: (action: Action) => void;
  ready: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    dispatch({ type: 'hydrate', state: load() });
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Private mode or full storage: the demo still works for this visit.
    }
    document.documentElement.lang = state.locale;
    document.documentElement.dir = state.locale === 'ar' ? 'rtl' : 'ltr';
  }, [state, ready]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
