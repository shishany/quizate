'use client';

/**
 * Showcase strings (/showcase only). Arabic first, English toggle, as the owner asked for the showcase; the
 * showcase follows the app's locale (Urdu falls back to Arabic here). Keys must match (i18n.test.ts).
 */
import { useStore } from '@/lib/store';

const ar = {
  demoData: 'بيانات توضيحية · Demo data',
  title: 'جولة في سبّاق',
  intro: 'شاهد كيف يجمع سبّاق بين المعرفة والمنافسة والرعاة، وكيف يكبر عبر المراحل.',
  phase: 'المرحلة',
  phases: { mvp: 'MVP', p2: 'المرحلة 2', p3: 'المرحلة 3' },
  startTour: 'ابدأ الجولة',
  nav: { home: 'الرئيسية', sponsor: 'الرعاة', impact: 'الأثر' },
  roadmap: 'خارطة الطريق',
  roadmapNote: 'تغيّر المرحلة الميزات في هذه الجلسة فقط. الصفحات العادية تبقى على ميزات MVP.',
  on: 'مفعّلة',
  off: 'غير مفعّلة',
  viewOnly: 'عرض فقط',
  soon: 'قريباً',
  mvpFeatures: 'في MVP الآن',
  live: {
    feed: 'مباشر الآن',
    won: { f: '{name} من {city} فازت +{d}', m: '{name} من {city} فاز +{d}' },
    playersToday: 'لاعبون اليوم',
    matchesToday: 'مباريات اليوم',
    questions: 'أسئلة أُجيب عنها',
    board: 'ترتيب الشهر (يتحرك مباشرة)',
    youth: 'ناشئ',
    matchTitle: 'مباراة فورية',
    matchBody: 'جرّب مباراة حقيقية الآن: منافس خلال ثانيتين.',
    matchCta: 'ابدأ مباراة فورية',
    searching: 'نبحث عن منافس…',
    found: 'وجدنا منافساً: {name} من {city}',
    result: { win: 'فزت!', loss: 'خسرت هذه المرة', draw: 'تعادل' },
    score: 'نقاطك {me} · نقاط المنافس {them}',
    again: 'مباراة أخرى',
    notSaved: 'لا تُحفظ هذه المباراة ولا تغيّر ترتيبك.',
  },
  sponsor: {
    title: 'قيمة الرعاية',
    intro: 'سؤال برعايتك يبقى أمام اللاعب عشر ثوانٍ كاملة وهو يفكّر فيه، لا ثانيتين قبل التخطي.',
    campaign: 'حملة {name}',
    views: 'مشاهدات',
    answers: 'إجابات',
    correct: 'نسبة الصحيح',
    attention: 'ثواني انتباه',
    compare: 'الانتباه لكل 1000 مشاهدة',
    sabbaq: 'سؤال في سبّاق (10 ث)',
    traditional: 'إعلان تقليدي (≈ 2 ث قبل التخطي)',
    times: '{n}× انتباه أكثر',
    cpm: 'التكلفة لكل 1000 مشاهدة',
    poolShare: 'نصيب الحملة من تمويل مجمّع جوائز الشهر',
    calc: 'احسب حملتك',
    calcQ: 'أسئلة برعايتك في كل مباراة',
    calcPlayers: 'لاعبون يومياً',
    calcPrice: 'السعر لكل 1000 مشاهدة (ر.س)',
    calcViews: 'مشاهدات شهرية',
    calcSar: 'قيمة شهرية (ر.س)',
    calcPool: 'تموّل {p}% من مجمّع الجوائز',
    calcNote: 'بافتراض مباراة واحدة لكل لاعب يومياً و30 يوماً في الشهر.',
    prizes: 'الجوائز يموّلها الرعاة',
    prizesBody:
      'مجمّع الشهر = الأقل من 16,500 ر.س وتمويل الرعاة، ويُوزَّع على أفضل 10 بالغين بعد التحقق من الهوية.',
    pool: 'مجمّع هذا الشهر',
    place: 'المركز {n}',
    youthAward: 'وأفضل 3 ناشئين (13–17) ينالون جائزة عينية.',
    locked: 'الجوائز النقدية مفعّلة بعد الموافقة النظامية فقط.',
  },
  impact: {
    title: 'أثر المبادرة',
    intro: 'مبادرة من الجمعية الأهلية الصالحية: كل سؤال يُجاب عنه معرفةٌ تنتشر.',
    questions: 'أسئلة أُجيب عنها اليوم',
    players: 'لاعبون وصلنا إليهم اليوم',
    cities: 'مدن',
    youth: 'ناشئون (13–17)',
    categories: 'المعرفة حسب الفئة',
    goals: 'أهداف الجمعية',
    goalKnowledge: ['نشر الثقافة والمعرفة', '{q} سؤال اليوم في {c} فئات معرفية.'],
    goalReach: ['الوصول لأكبر عدد', '{p} لاعب من {n} مدن، منهم {y} من الناشئين.'],
    goalSupport: ['استقطاب الداعمين', '{s} رعاة يموّلون {f} ر.س هذا الشهر، تعود جوائز للاعبين.'],
  },
  features: {
    classic_1v1: ['تحدٍّ 1 ضد 1', 'عشرة أسئلة، عشر ثوانٍ لكل سؤال، ونقاط حسب السرعة.'],
    categories: ['الفئات', 'منوّع، تاريخ، جغرافيا، أدب، علوم، رياضة.'],
    rating_monthly: ['تقييم شهري', 'يبدأ الجميع كل شهر من 1000 بنظام Elo.'],
    sponsored_questions: ['أسئلة برعاية', 'شريط «برعاية» تحت السؤال وتقارير مجمّعة للراعي.'],
    prizes_cash_18plus: [
      'جوائز نقدية 18+',
      'لأفضل 10 بعد التحقق من الهوية، بعد الموافقة النظامية.',
    ],
    youth_award: ['جائزة الناشئين', 'جائزة عينية لأفضل 3 ناشئين (13–17) كل شهر.'],
    challenge_friend: ['تحدَّ صديقاً', 'رابط دعوة لمباراة خاصة لا تؤثر في التقييم.'],
    ghost_opponent: ['منافس مسجّل', 'إن لم يتوفر منافس خلال 20 ثانية.'],
    ladder: ['سلّم الترقّي', 'مستويات وأقسام بمكافآت معنوية.'],
    mirror_challenge: ['تحدّي المرآة', 'الأسئلة نفسها للجميع كل يوم.'],
    speed_round: ['جولة السرعة', 'أكبر عدد من الإجابات في 60 ثانية.'],
    practice_bot: ['تدريب', 'العب ضد خصم آلي بلا تأثير على الترتيب.'],
    daily_claim: ['المكافأة اليومية', 'عملات تُكتسب باللعب فقط.'],
    missions: ['المهام', 'مهام يومية وأسبوعية.'],
    nearby_matching: ['منافس قريب', 'مطابقة حسب المسافة التقريبية.'],
    nafath_required: ['نفاذ إلزامي', 'التحقق عبر نفاذ عند الدخول.'],
    locale_ur: ['الأردية', 'واجهة كاملة باللغة الأردية.'],
  },
  phase3: {
    clubs: ['الأندية', 'فرق دائمة بأسماء وشعارات.'],
    team_trivia: ['مسابقة الفرق', 'فريق ضد فريق في الأسئلة.'],
    team_sudoku: ['سودوكو الفرق', 'لغز تعاوني بالأرقام.'],
    word_game: ['لعبة الكلمات', 'تحدٍّ لغوي بالعربية.'],
    city_leaderboards: ['ترتيب المدن', 'أي مدينة تتصدّر هذا الشهر؟'],
    sponsor_self_service: ['بوابة الرعاة الذاتية', 'يطلق الراعي حملته ويتابعها بنفسه.'],
  },
};

type Widen<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? readonly string[]
      : Widen<T[K]>;
};
export type ShowcaseDict = Widen<typeof ar>;

const en: ShowcaseDict = {
  demoData: 'بيانات توضيحية · Demo data',
  title: 'A tour of Sabbaq',
  intro:
    'See how Sabbaq brings knowledge, competition and sponsors together, and how it grows phase by phase.',
  phase: 'Phase',
  phases: { mvp: 'MVP', p2: 'Phase 2', p3: 'Phase 3' },
  startTour: 'Start tour',
  nav: { home: 'Home', sponsor: 'Sponsors', impact: 'Impact' },
  roadmap: 'Roadmap',
  roadmapNote:
    'The phase changes features for this session only. Normal pages stay on the MVP features.',
  on: 'On',
  off: 'Off',
  viewOnly: 'View only',
  soon: 'Coming soon',
  mvpFeatures: 'In the MVP now',
  live: {
    feed: 'Live now',
    won: { f: '{name} from {city} won +{d}', m: '{name} from {city} won +{d}' },
    playersToday: 'Players today',
    matchesToday: 'Matches today',
    questions: 'Questions answered',
    board: 'Monthly ranking (moving live)',
    youth: 'Youth',
    matchTitle: 'Instant match',
    matchBody: 'Try a real match now: an opponent within two seconds.',
    matchCta: 'Start an instant match',
    searching: 'Finding an opponent…',
    found: 'Opponent found: {name} from {city}',
    result: { win: 'You won!', loss: 'You lost this time', draw: 'Draw' },
    score: 'Your points {me} · opponent {them}',
    again: 'Another match',
    notSaved: 'This match is not saved and does not change your ranking.',
  },
  sponsor: {
    title: 'Sponsor value',
    intro:
      'A sponsored question stays in front of the player for a full ten seconds while they think about it, not two seconds before a skip.',
    campaign: '{name} campaign',
    views: 'Views',
    answers: 'Answers',
    correct: '% correct',
    attention: 'Seconds of attention',
    compare: 'Attention per 1,000 views',
    sabbaq: 'A Sabbaq question (10 s)',
    traditional: 'Traditional ad (≈ 2 s before skip)',
    times: '{n}× more attention',
    cpm: 'Cost per 1,000 views',
    poolShare: "Campaign's share of this month's prize pool funding",
    calc: 'Size your campaign',
    calcQ: 'Your sponsored questions per match',
    calcPlayers: 'Daily players',
    calcPrice: 'Price per 1,000 views (SAR)',
    calcViews: 'Monthly views',
    calcSar: 'Monthly value (SAR)',
    calcPool: 'Funds {p}% of the prize pool',
    calcNote: 'Assumes one match per player per day and 30 days a month.',
    prizes: 'Prizes funded by sponsors',
    prizesBody:
      "The month's pool is the lower of SAR 16,500 and sponsor funding, shared by the top 10 adults after an ID check.",
    pool: "This month's pool",
    place: 'Place {n}',
    youthAward: 'And the top 3 youth (13–17) win an in-kind award.',
    locked: 'Cash prizes switch on only after legal approval.',
  },
  impact: {
    title: 'Impact of the initiative',
    intro:
      'An initiative of Al-Salihiya Civil Association: every question answered spreads knowledge.',
    questions: 'Questions answered today',
    players: 'Players reached today',
    cities: 'Cities',
    youth: 'Youth (13–17)',
    categories: 'Knowledge by category',
    goals: "The association's goals",
    goalKnowledge: [
      'Spreading culture and knowledge',
      '{q} questions today across {c} knowledge categories.',
    ],
    goalReach: [
      'Reaching as many people as possible',
      '{p} players from {n} cities, {y} of them youth.',
    ],
    goalSupport: [
      'Attracting supporters',
      '{s} sponsors fund SAR {f} this month, returned to players as prizes.',
    ],
  },
  features: {
    classic_1v1: ['1v1 challenge', 'Ten questions, ten seconds each, points for speed.'],
    categories: ['Categories', 'Mixed, History, Geography, Literature, Science, Sport.'],
    rating_monthly: ['Monthly rating', 'Everyone restarts each month at 1,000 (Elo).'],
    sponsored_questions: [
      'Sponsored questions',
      'A "sponsored by" bar under the question, aggregated sponsor reports.',
    ],
    prizes_cash_18plus: [
      'Cash prizes 18+',
      'For the top 10 after an ID check, once legally approved.',
    ],
    youth_award: ['Youth award', 'An in-kind award for the top 3 youth (13–17) each month.'],
    challenge_friend: [
      'Challenge a friend',
      'An invite link for a private match that never moves your rating.',
    ],
    ghost_opponent: ['Recorded opponent', 'When no opponent is found within 20 seconds.'],
    ladder: ['Ranked ladder', 'Tiers and divisions with cosmetic rewards.'],
    mirror_challenge: ['Mirror Challenge', 'The same questions for everyone, every day.'],
    speed_round: ['Speed round', 'As many answers as you can in 60 seconds.'],
    practice_bot: ['Practice', 'Play a bot without touching the ranking.'],
    daily_claim: ['Daily reward', 'Coins earned by playing only.'],
    missions: ['Missions', 'Daily and weekly missions.'],
    nearby_matching: ['Nearby opponent', 'Matching by approximate distance.'],
    nafath_required: ['Nafath required', 'Identity check through Nafath at sign-in.'],
    locale_ur: ['Urdu', 'The full interface in Urdu.'],
  },
  phase3: {
    clubs: ['Clubs', 'Standing teams with names and badges.'],
    team_trivia: ['Team trivia', 'Team against team in questions.'],
    team_sudoku: ['Team sudoku', 'A cooperative number puzzle.'],
    word_game: ['Word game', 'An Arabic word challenge.'],
    city_leaderboards: ['City leaderboards', 'Which city leads this month?'],
    sponsor_self_service: [
      'Sponsor self-service',
      'Sponsors launch and follow their own campaigns.',
    ],
  },
};

export const SHOWCASE_STRINGS = { ar, en } as const;

/** Showcase strings for the app's locale (Urdu falls back to Arabic). */
export function useS(): { s: ShowcaseDict; lang: 'ar' | 'en' } {
  const { state } = useStore();
  const lang = state.locale === 'en' ? 'en' : 'ar';
  return { s: SHOWCASE_STRINGS[lang], lang };
}
