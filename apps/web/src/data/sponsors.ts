import {
  DAY_MS,
  DEFAULT_CONFIG,
  riyadhDayKey,
  seededRng,
  type Campaign,
  type ReportRow,
} from '@quizate/game';
import type { BiText } from './questions';

/**
 * Sample sponsors for the web demo. All fictional, with original logos drawn for the demo. Real brands appear only
 * with their written approval, uploading their own logo for their own campaign (BRD section 6, FR-16).
 */
export interface SampleSponsor {
  id: string;
  campaignId: string;
  name: BiText;
  tagline: BiText;
  color: string;
}

export const SAMPLE_SPONSORS: SampleSponsor[] = [
  {
    id: 'date-oasis',
    campaignId: 'cmp-oasis',
    name: { ar: 'واحة التمور', en: 'Date Oasis' },
    tagline: {
      ar: 'تمور سعودية فاخرة من المزرعة إلى مائدتك.',
      en: 'Fine Saudi dates, from the farm to your table.',
    },
    color: '#8a6420',
  },
  {
    id: 'masaa-coffee',
    campaignId: 'cmp-masaa',
    name: { ar: 'قهوة المساء', en: 'Masaa Coffee' },
    tagline: {
      ar: 'قهوة مختصة محمّصة محلياً. جرّبها اليوم.',
      en: 'Specialty coffee, roasted locally. Try it today.',
    },
    color: '#6b3e26',
  },
  {
    id: 'ittisal-plus',
    campaignId: 'cmp-ittisal',
    name: { ar: 'اتصال بلس', en: 'Ittisal Plus' },
    tagline: { ar: 'باقات بيانات أسرع لكل المدن.', en: 'Faster data plans in every city.' },
    color: '#0a72ad',
  },
];

export const sponsorForCampaign = (campaignId: string | null) =>
  SAMPLE_SPONSORS.find((s) => s.campaignId === campaignId);

/**
 * Sample campaigns (CR v3 section 8): each runs from 12 days before to 18 days after "now". Price per 1,000 billable
 * views is set per campaign in admin (`prices`, halalas); otherwise the configured default (SAR 40).
 */
export function sampleCampaigns(
  now: Date,
  prices: Readonly<Record<string, number>> = {},
  defaultPrice = DEFAULT_CONFIG.sponsor.defaultPricePer1000Halalas,
): Campaign[] {
  return SAMPLE_SPONSORS.map((s, i) => ({
    id: s.campaignId,
    sponsorId: s.id,
    startsAt: new Date(now.getTime() - (12 + i * 3) * DAY_MS).toISOString(),
    endsAt: new Date(now.getTime() + 18 * DAY_MS).toISOString(),
    viewQuota: 300_000,
    pricePer1000Halalas: prices[s.campaignId] ?? defaultPrice,
  }));
}

/**
 * Daily totals that stand in for the other players' events in the sample version (generating every event object
 * would be wasteful). The player's own events are added on top from the events table.
 */
export function sampleCampaignRows(campaign: Campaign, now: Date): ReportRow[] {
  const rng = seededRng(campaign.id.length * 7919 + campaign.viewQuota);
  const rows: ReportRow[] = [];
  for (
    let t = new Date(campaign.startsAt).getTime();
    t < Math.min(now.getTime(), new Date(campaign.endsAt).getTime());
    t += DAY_MS
  ) {
    const views = Math.round(6_000 + rng() * 6_000);
    const billableViews = Math.round(views * (0.82 + rng() * 0.1));
    const answers = Math.round(views * (0.9 + rng() * 0.08));
    const correct = Math.round(answers * (0.55 + rng() * 0.3));
    rows.push({
      day: riyadhDayKey(new Date(t)),
      views,
      billableViews,
      answers,
      correct,
      correctPct: null,
    });
  }
  return rows;
}
