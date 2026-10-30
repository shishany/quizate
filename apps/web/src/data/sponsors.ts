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
