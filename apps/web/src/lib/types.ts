import type {
  DistanceBand,
  GameConfig,
  Outcome,
  RankedResult,
  SelectableQuestion,
} from '@quizate/game';
import type { BiText, Category } from '@/data/questions';

export type Locale = 'ar' | 'en';
export type Mode = 'ranked' | 'practice' | 'speed';

export interface Question extends SelectableQuestion {
  category: Category;
  text: BiText;
  /** Correct answer first; shuffled per match. */
  options: BiText[];
  version: number;
  authorId: string;
  reviewerId: string | null;
  campaignId: string | null;
  reports: number;
  history: { at: string; actor: string; action: QuestionAction; version: number }[];
}

export type QuestionAction =
  'created' | 'submitted' | 'approved' | 'rejected' | 'published' | 'retired' | 'edited' | 'voided';

export interface City {
  id: string;
  name: BiText;
  lat: number;
  lng: number;
}

export interface SamplePlayer {
  id: string;
  name: BiText;
  cityId: string;
  rating: number;
  /** Rounded sample coordinates near the city centre. */
  location: { lat: number; lng: number };
  allTimeBase: number;
}

export interface Player {
  id: string;
  name: string;
  /** Masked for display, e.g. +966 5•• ••• 123. The full number is not kept. */
  phoneMasked: string;
  birthDate: string;
  cityId: string;
  rating: number;
  createdAt: string;
  consents: {
    type: 'terms' | 'privacy' | 'location' | 'marketing';
    version: string;
    grantedAt: string;
  }[];
}

export interface MatchSummary {
  id: string;
  mode: Mode;
  at: string;
  opponent: {
    id: string;
    name: BiText;
    cityId: string;
    band: DistanceBand | null;
    rating: number;
  } | null;
  myScore: number;
  opponentScore: number | null;
  outcome: Outcome | null;
  correct: number;
  questions: number;
  monthlyPoints: number;
  counted: boolean;
  ratingBefore: number;
  ratingAfter: number;
  forfeit: boolean;
  /** Speed round: answered in the time limit. */
  answered?: number;
}

export type FraudSignal =
  'inhuman_speed' | 'collusion' | 'shared_device' | 'location_jump' | 'accuracy_jump';
export type FraudStatus = 'open' | 'investigating' | 'cleared' | 'warned' | 'suspended';

export interface FraudFlag {
  id: string;
  at: string;
  playerIds: string[];
  signal: FraudSignal;
  risk: number;
  status: FraudStatus;
  evidence: BiText;
  decision?: { at: string; actor: string; reason: string };
}

export type AdminRole =
  | 'super_admin'
  | 'content_editor'
  | 'content_reviewer'
  | 'sponsor_manager'
  | 'fraud_analyst'
  | 'prize_officer'
  | 'finance_approver';

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  reason: string | null;
  before?: string;
  after?: string;
}

export interface ConfigChange {
  at: string;
  actor: string;
  key: string;
  from: string;
  to: string;
  reason: string;
}

export interface DemoState {
  version: number;
  locale: Locale;
  player: Player | null;
  config: GameConfig;
  configHistory: ConfigChange[];
  questions: Question[];
  myResults: RankedResult[];
  matches: MatchSummary[];
  /** Question id → last time this player saw it in ranked play (BR-13). */
  seen: Record<string, string>;
  abandons: string[];
  speedBest: number;
  following: string[];
  fraud: FraudFlag[];
  audit: AuditEntry[];
  adminRole: AdminRole | null;
  /** A ranked match in progress. Left behind (navigation, refresh, closed tab), it is settled as a forfeit (BR-11). */
  activeRanked: {
    id: string;
    at: string;
    opponent: NonNullable<MatchSummary['opponent']>;
    ratingBefore: number;
  } | null;
  /** Sponsored answers given by this player: city → counts. */
  sponsorTally: { impressions: number; answers: number; correct: number };
}
