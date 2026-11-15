import {
  campaignReport,
  riyadhMonthKey,
  type Campaign,
  type ReportRow,
  type SponsorEvent,
} from '@quizate/game';
import { sampleCampaignRows } from '@/data/sponsors';

const pct = (c: number, a: number) => (a ? Math.round((c / a) * 1000) / 10 : null);

/** CR v3 section 8: a campaign's report by day, sample totals plus the player's own events. */
export function campaignRows(campaign: Campaign, events: readonly SponsorEvent[], now: Date): ReportRow[] {
  const days = new Map<string, ReportRow>();
  for (const r of [...sampleCampaignRows(campaign, now), ...campaignReport(events, campaign.id).byDay]) {
    const d = days.get(r.day) ?? { day: r.day, views: 0, billableViews: 0, answers: 0, correct: 0, correctPct: null };
    d.views += r.views;
    d.billableViews += r.billableViews;
    d.answers += r.answers;
    d.correct += r.correct;
    days.set(r.day, d);
  }
  return [...days.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((r) => ({ ...r, correctPct: pct(r.correct, r.answers) }));
}

/** Sponsor funding for a Riyadh month in halalas: billable views (shown >= 3 s, within quota) x campaign price. */
export function fundingForMonth(
  campaigns: readonly Campaign[],
  events: readonly SponsorEvent[],
  month: string,
  now: Date,
): number {
  let total = 0;
  for (const c of campaigns) {
    let used = 0;
    let billable = 0;
    for (const r of campaignRows(c, events, now)) {
      const take = Math.max(0, Math.min(r.billableViews, c.viewQuota - used));
      used += take;
      if (riyadhMonthKey(`${r.day}T12:00:00+03:00`) === month) billable += take;
    }
    total += Math.floor((billable * c.pricePer1000Halalas) / 1000);
  }
  return total;
}
