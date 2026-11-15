/**
 * Sponsored questions (Sabbaq change request v3, section 8). Sponsors run campaigns; questions carry an optional
 * campaign id. A `view` is counted when the question is shown and an `answer` when it is answered. Events go to an
 * append-only events table in batches (one write per match, not one per request); reports are computed from it.
 * Sponsors only ever see aggregates (architecture rule 9).
 */
import type { GameConfig } from './config.js';
import { riyadhDayKey, riyadhMonthKey } from './time.js';

export interface Sponsor {
  id: string;
  name: { ar: string; en: string };
  /** Logo asset id or URL (uploaded by the sponsor). */
  logo: string | null;
}

export interface Campaign {
  id: string;
  sponsorId: string;
  /** UTC ISO. */
  startsAt: string;
  endsAt: string;
  /** Billable views paid for. */
  viewQuota: number;
  /** Price per 1,000 billable views, in halalas (money is integer halalas); set per campaign in admin, default 4,000. */
  pricePer1000Halalas: number;
}

export interface SponsorEvent {
  type: 'view' | 'answer';
  campaignId: string;
  questionId: string;
  /** UTC ISO. */
  at: string;
  /** Answers only. */
  correct?: boolean;
  /** Views only: shown on screen for at least the billable minimum (3 s). Only billable views are paid for. */
  billable?: boolean;
}

/**
 * The events for one finished match: a view for every sponsored question shown, an answer for every one answered.
 * Time on screen is the server-measured time to answer, or the whole question time on a timeout; a view is
 * billable when that reaches `billableViewMs`.
 */
export function matchSponsorEvents(
  questions: readonly { id: string; campaignId: string | null }[],
  answers: readonly { latencyMs: number | null; correct: boolean }[],
  at: string,
  cfg: GameConfig,
): SponsorEvent[] {
  const out: SponsorEvent[] = [];
  questions.forEach((q, i) => {
    if (!q.campaignId) return;
    const a = answers[i];
    const shownMs = a?.latencyMs ?? cfg.questionSeconds * 1000;
    out.push({
      type: 'view',
      campaignId: q.campaignId,
      questionId: q.id,
      at,
      billable: shownMs >= cfg.sponsor.billableViewMs,
    });
    if (a && a.latencyMs !== null) {
      out.push({ type: 'answer', campaignId: q.campaignId, questionId: q.id, at, correct: a.correct });
    }
  });
  return out;
}

export interface ReportRow {
  /** Riyadh day, YYYY-MM-DD. */
  day: string;
  views: number;
  /** Views shown >= 3 s: the only ones paid for. */
  billableViews: number;
  /** Quality metrics only (not billed): answers and % correct. */
  answers: number;
  correct: number;
  /** 0-100, one decimal; null with no answers. */
  correctPct: number | null;
}

const pct = (correct: number, answers: number) =>
  answers ? Math.round((correct / answers) * 1000) / 10 : null;

/** Campaign report: totals and one row per Riyadh day, oldest first. */
export function campaignReport(
  events: readonly SponsorEvent[],
  campaignId: string,
): { total: Omit<ReportRow, 'day'>; byDay: ReportRow[] } {
  const days = new Map<string, ReportRow>();
  const total = { views: 0, billableViews: 0, answers: 0, correct: 0, correctPct: null as number | null };
  for (const e of events) {
    if (e.campaignId !== campaignId) continue;
    const day = riyadhDayKey(e.at);
    const row = days.get(day) ?? { day, views: 0, billableViews: 0, answers: 0, correct: 0, correctPct: null };
    if (e.type === 'view') {
      row.views++;
      total.views++;
      if (e.billable) {
        row.billableViews++;
        total.billableViews++;
      }
    } else {
      row.answers++;
      total.answers++;
      if (e.correct) {
        row.correct++;
        total.correct++;
      }
    }
    days.set(day, row);
  }
  const byDay = [...days.values()]
    .sort((a, b) => a.day.localeCompare(b.day))
    .map((r) => ({ ...r, correctPct: pct(r.correct, r.answers) }));
  return { total: { ...total, correctPct: pct(total.correct, total.answers) }, byDay };
}

/** CSV for the campaign report (aggregates only). */
export function reportCsv(rows: readonly ReportRow[]): string {
  const lines = ['day,views,billable_views,answers,correct,correct_pct'];
  for (const r of rows)
    lines.push([r.day, r.views, r.billableViews, r.answers, r.correct, r.correctPct ?? ''].join(','));
  return `${lines.join('\n')}\n`;
}

/**
 * Sponsor funding earned in a Riyadh month, in halalas: billable views in that month (capped at each campaign's
 * quota, counted in time order) x the campaign's price per 1,000 views, rounded down to whole halalas.
 */
export function sponsorFundingForMonth(
  campaigns: readonly Campaign[],
  events: readonly SponsorEvent[],
  month: string,
): number {
  let total = 0;
  for (const c of campaigns) {
    const views = events
      .filter((e) => e.type === 'view' && e.billable && e.campaignId === c.id)
      .sort((a, b) => a.at.localeCompare(b.at));
    const billable = views.slice(0, c.viewQuota).filter((e) => riyadhMonthKey(e.at) === month).length;
    total += Math.floor((billable * c.pricePer1000Halalas) / 1000);
  }
  return total;
}

export const campaignLive = (c: Campaign, now: Date): boolean =>
  new Date(c.startsAt).getTime() <= now.getTime() && now.getTime() < new Date(c.endsAt).getTime();
