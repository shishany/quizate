import {
  DEFAULT_CONFIG,
  botAnswer,
  matchScore,
  outcomeFor,
  riyadhMonthKey,
  roundCoord,
  seededRng,
  type GameConfig,
  type RankedResult,
} from '@quizate/game';
import {
  BRAND_QUESTIONS,
  DRAFT_QUESTIONS,
  IMAGE_QUESTIONS,
  SEED_QUESTIONS,
  SPONSORED_QUESTIONS,
  type SeedQuestion,
} from '@/data/questions';
import type {
  AdminRole,
  City,
  DemoState,
  FraudFlag,
  Locale,
  Question,
  SamplePlayer,
} from './types';

export const STORAGE_KEY = 'quizate-demo-v1';
export const STATE_VERSION = 4;

/** The one verification code of the sample version, for every number and every admin role. No message is sent. */
export const SAMPLE_CODE = '000000';

/** Ten cities, as in the build prompt's seed. Centre points rounded to about 1 km. */
export const CITIES: City[] = [
  { id: 'riyadh', name: { ar: 'الرياض', ur: 'ریاض', en: 'Riyadh' }, lat: 24.71, lng: 46.68 },
  { id: 'jeddah', name: { ar: 'جدة', ur: 'جدہ', en: 'Jeddah' }, lat: 21.54, lng: 39.17 },
  {
    id: 'makkah',
    name: { ar: 'مكة المكرمة', ur: 'مکہ مکرمہ', en: 'Makkah' },
    lat: 21.39,
    lng: 39.86,
  },
  {
    id: 'madinah',
    name: { ar: 'المدينة المنورة', ur: 'مدینہ منورہ', en: 'Madinah' },
    lat: 24.47,
    lng: 39.61,
  },
  { id: 'dammam', name: { ar: 'الدمام', ur: 'دمام', en: 'Dammam' }, lat: 26.43, lng: 50.1 },
  { id: 'khobar', name: { ar: 'الخبر', ur: 'الخبر', en: 'Al Khobar' }, lat: 26.28, lng: 50.21 },
  { id: 'abha', name: { ar: 'أبها', ur: 'ابہا', en: 'Abha' }, lat: 18.22, lng: 42.51 },
  { id: 'tabuk', name: { ar: 'تبوك', ur: 'تبوک', en: 'Tabuk' }, lat: 28.38, lng: 36.57 },
  { id: 'buraydah', name: { ar: 'بريدة', ur: 'بریدہ', en: 'Buraydah' }, lat: 26.33, lng: 43.97 },
  { id: 'hail', name: { ar: 'حائل', ur: 'حائل', en: "Ha'il" }, lat: 27.52, lng: 41.69 },
];

export const cityById = (id: string) => CITIES.find((c) => c.id === id) ?? (CITIES[0] as City);

const NAMES: [string, string][] = [
  ['صقر الرياض', 'Riyadh Falcon'],
  ['نجمة جدة', 'Jeddah Star'],
  ['أبو فهد', 'Abu Fahad'],
  ['ريم', 'Reem'],
  ['المحلل', 'The Analyst'],
  ['سلطان', 'Sultan'],
  ['لمى', 'Lama'],
  ['عبقري الخبر', 'Khobar Genius'],
  ['نورة', 'Noura'],
  ['فارس', 'Fares'],
  ['جود', 'Joud'],
  ['تركي', 'Turki'],
  ['هيا', 'Haya'],
  ['بدر', 'Badr'],
  ['غيمة', 'Ghaima'],
  ['ماجد', 'Majed'],
  ['دانة', 'Dana'],
  ['مشعل', 'Mishal'],
  ['شهد', 'Shahad'],
  ['راكان', 'Rakan'],
  ['سارة', 'Sarah'],
  ['ياسر', 'Yasser'],
  ['ليان', 'Layan'],
  ['عمر', 'Omar'],
  ['رهف', 'Rahaf'],
  ['خالد', 'Khaled'],
  ['أسيل', 'Aseel'],
  ['نايف', 'Naif'],
  ['وعد', 'Waad'],
  ['زياد', 'Ziyad'],
  ['مها', 'Maha'],
  ['حمد', 'Hamad'],
  ['رنا', 'Rana'],
  ['سعود', 'Saud'],
  ['أروى', 'Arwa'],
  ['طلال', 'Talal'],
  ['جنى', 'Jana'],
  ['عبدالله', 'Abdullah'],
  ['ملاك', 'Malak'],
  ['يوسف', 'Yousef'],
];

/** Sample players. Fixed per seed; their month results are regenerated relative to "now" on every load. */
export const SAMPLE_PLAYERS: SamplePlayer[] = (() => {
  const rng = seededRng(2034);
  return NAMES.map(([ar, en], i) => {
    const city = CITIES[i % CITIES.length] as City;
    return {
      id: `sp-${String(i + 1).padStart(2, '0')}`,
      name: { ar, en },
      cityId: city.id,
      rating: Math.round(950 + rng() * 600),
      location: {
        lat: roundCoord(city.lat + (rng() - 0.5) * 0.3),
        lng: roundCoord(city.lng + (rng() - 0.5) * 0.3),
      },
      allTimeBase: Math.round(2000 + rng() * 26000) / 2,
    };
  });
})();

export const samplePlayerById = (id: string) => SAMPLE_PLAYERS.find((p) => p.id === id);

/**
 * This month's ranked results for every sample player, generated from the month key so the leaderboard looks
 * lived-in on any day. Times fall between the start of the Riyadh month and now.
 */
export function sampleMonthResults(now: Date, cfg: GameConfig): Map<string, RankedResult[]> {
  const month = riyadhMonthKey(now);
  const rng = seededRng(Number(month.replace('-', '')));
  const monthStart = new Date(`${month}-01T00:00:00+03:00`).getTime();
  const span = Math.max(now.getTime() - monthStart, 60_000);
  const elapsed = Math.max(0.4, Math.min(1, span / (30 * 24 * 3600 * 1000)));
  const out = new Map<string, RankedResult[]>(SAMPLE_PLAYERS.map((p) => [p.id, []]));

  SAMPLE_PLAYERS.forEach((p, i) => {
    const target = Math.round((8 + rng() * 62) * elapsed);
    for (let m = 0; m < target; m++) {
      const opp = SAMPLE_PLAYERS[
        (i + 1 + Math.floor(rng() * (SAMPLE_PLAYERS.length - 1))) % SAMPLE_PLAYERS.length
      ] as SamplePlayer;
      const at = new Date(monthStart + rng() * span).toISOString();
      const mine = Array.from({ length: cfg.questionsPerMatch }, () => {
        const a = botAnswer(
          p.rating,
          rng() < 0.3 ? 'easy' : rng() < 0.6 ? 'medium' : 'hard',
          cfg,
          rng,
        );
        return {
          option: a.latencyMs === null ? null : 0,
          correct: a.correct,
          latencyMs: a.latencyMs,
        };
      });
      const theirs = Array.from({ length: cfg.questionsPerMatch }, () =>
        botAnswer(opp.rating, 'medium', cfg, rng),
      );
      const score = matchScore(mine, cfg);
      const oppScore = matchScore(
        theirs.map((a) => ({ ...a, option: 0 })),
        cfg,
      );
      const answered = mine.filter((a) => a.latencyMs !== null);
      out.get(p.id)?.push({
        matchId: `${p.id}-${m}`,
        at,
        opponentId: opp.id,
        outcome: outcomeFor(score, oppScore),
        score,
        correct: score / cfg.pointsPerCorrect,
        questions: cfg.questionsPerMatch,
        latencyTotalMs: answered.reduce((s, a) => s + (a.latencyMs ?? 0), 0),
        answered: answered.length,
      });
    }
  });
  return out;
}

export const ADMIN_USERS: Record<
  AdminRole,
  { id: string; name: { ar: string; en: string; ur: string } }
> = {
  super_admin: {
    id: 'adm-huda',
    name: { ar: 'هدى (مدير النظام)', en: 'Huda (super admin)', ur: 'ہدیٰ (سپر ایڈمن)' },
  },
  content_editor: {
    id: 'adm-sara',
    name: { ar: 'سارة (محررة المحتوى)', en: 'Sara (content editor)', ur: 'سارہ (مواد ایڈیٹر)' },
  },
  content_reviewer: {
    id: 'adm-khalid',
    name: { ar: 'خالد (مراجع المحتوى)', en: 'Khalid (content reviewer)', ur: 'خالد (مواد ریویور)' },
  },
  sponsor_manager: {
    id: 'adm-noura',
    name: { ar: 'نورة (مديرة الرعاة)', en: 'Noura (sponsor manager)', ur: 'نورہ (اسپانسر مینیجر)' },
  },
  fraud_analyst: {
    id: 'adm-faisal',
    name: { ar: 'فيصل (محلل الاحتيال)', en: 'Faisal (fraud analyst)', ur: 'فیصل (فراڈ تجزیہ کار)' },
  },
  prize_officer: {
    id: 'adm-omar',
    name: { ar: 'عمر (مسؤول الجوائز)', en: 'Omar (prize officer)', ur: 'عمر (انعامات افسر)' },
  },
  finance_approver: {
    id: 'adm-lama',
    name: {
      ar: 'لمى (معتمدة المالية)',
      en: 'Lama (finance approver)',
      ur: 'لمیٰ (مالیاتی منظور کنندہ)',
    },
  },
};

export const adminName = (id: string, locale: Locale) =>
  Object.values(ADMIN_USERS).find((u) => u.id === id)?.name[locale] ?? id;

function toQuestion(s: SeedQuestion, status: Question['status'], at: string): Question {
  const author = ADMIN_USERS.content_editor.id;
  const reviewer = status === 'published' ? ADMIN_USERS.content_reviewer.id : null;
  const history: Question['history'] = [{ at, actor: author, action: 'created', version: 1 }];
  if (status === 'in_review' || status === 'published')
    history.push({ at, actor: author, action: 'submitted', version: 1 });
  if (status === 'published' && reviewer)
    history.push(
      { at, actor: reviewer, action: 'approved', version: 1 },
      { at, actor: reviewer, action: 'published', version: 1 },
    );
  return {
    id: s.id,
    category: s.category,
    difficulty: s.difficulty,
    text: s.text,
    options: [...s.options],
    status,
    expiresAt: null,
    sponsored: Boolean(s.campaignId),
    campaignId: s.campaignId ?? null,
    image: s.image,
    version: 1,
    authorId: author,
    reviewerId: reviewer,
    reports: 0,
    history,
  };
}

function sampleFraud(now: Date): FraudFlag[] {
  const ago = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
  return [
    {
      id: 'ff-1',
      at: ago(5),
      playerIds: ['sp-08'],
      signal: 'inhuman_speed',
      risk: 72,
      status: 'open',
      evidence: {
        ar: '4 إجابات أسرع من 800 ملي ثانية في مباراة واحدة',
        en: '4 answers under 800 ms in one match',
      },
    },
    {
      id: 'ff-2',
      at: ago(20),
      playerIds: ['sp-14', 'sp-27'],
      signal: 'collusion',
      risk: 64,
      status: 'investigating',
      evidence: {
        ar: 'تبادل منتظم للفوز والخسارة بين الحسابين (4 مباريات)',
        en: 'Wins and losses traded evenly between the two accounts (4 matches)',
      },
    },
    {
      id: 'ff-3',
      at: ago(31),
      playerIds: ['sp-19', 'sp-33'],
      signal: 'shared_device',
      risk: 55,
      status: 'open',
      evidence: { ar: 'حسابان على الجهاز نفسه', en: 'Two accounts on the same device' },
    },
    {
      id: 'ff-4',
      at: ago(52),
      playerIds: ['sp-05'],
      signal: 'location_jump',
      risk: 41,
      status: 'open',
      evidence: {
        ar: 'موقعان يفصل بينهما 800 كم خلال 10 دقائق',
        en: 'Two locations 800 km apart within 10 minutes',
      },
    },
    {
      id: 'ff-5',
      at: ago(80),
      playerIds: ['sp-11'],
      signal: 'accuracy_jump',
      risk: 38,
      status: 'cleared',
      evidence: {
        ar: 'دقة 100% على أسئلة جديدة مقابل 55% سابقاً',
        en: '100% accuracy on new questions against a 55% history',
      },
      decision: {
        at: ago(60),
        actor: 'adm-faisal',
        reason: 'Consistent with recent practice history.',
      },
    },
  ];
}

export function initialState(now = new Date()): DemoState {
  const at = new Date(now.getTime() - 40 * 24 * 3600_000).toISOString();
  const questions = [
    ...SEED_QUESTIONS.map((s) => toQuestion(s, 'published', at)),
    ...SPONSORED_QUESTIONS.map((s) => toQuestion(s, 'published', at)),
    ...IMAGE_QUESTIONS.map((s) => toQuestion(s, 'published', at)),
    ...BRAND_QUESTIONS.map((s) => toQuestion(s, 'published', at)),
    ...DRAFT_QUESTIONS.map((s, i) =>
      toQuestion(s, i === 0 ? 'draft' : 'in_review', now.toISOString()),
    ),
  ];
  const reported = questions.find((x) => x.id === 'q-033');
  if (reported) reported.reports = 2;
  return {
    version: STATE_VERSION,
    locale: 'ar',
    player: null,
    config: structuredClone(DEFAULT_CONFIG),
    configHistory: [],
    questions,
    myResults: [],
    matches: [],
    seen: {},
    abandons: [],
    speedBest: 0,
    following: [],
    fraud: sampleFraud(now),
    audit: [],
    adminRole: null,
    sponsorTally: { impressions: 0, answers: 0, correct: 0 },
    activeRanked: null,
    savedAccount: null,
    xp: [],
    coins: [],
    activeDays: [],
    lastClaim: null,
    mirror: {},
    questionOfDay: {},
    missionClaims: [],
    roadClaims: [],
    cosmetics: [],
    equipped: { frame: null, title: null },
    ibanRequiredAt: 'prize',
  };
}
