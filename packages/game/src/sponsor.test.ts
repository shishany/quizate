import { describe, expect, it } from 'vitest';
import { campaignReport, matchSponsorEvents, reportCsv, sponsorFundingForMonth } from './sponsor.js';

describe('sponsored questions (CR v3 section 8)', () => {
  const qs = [
    { id: 'q1', campaignId: 'c1' },
    { id: 'q2', campaignId: null },
    { id: 'q3', campaignId: 'c1' },
  ];
  const answers = [
    { latencyMs: 2000, correct: true },
    { latencyMs: 2000, correct: true },
    { latencyMs: null, correct: false },
  ];

  it('counts a view when shown and an answer when answered', () => {
    const ev = matchSponsorEvents(qs, answers, '2026-11-10T08:00:00Z');
    expect(ev.map((e) => `${e.type}:${e.questionId}`)).toEqual(['view:q1', 'answer:q1', 'view:q3']);
  });

  it('reports views, answers and % correct by Riyadh day, with CSV', () => {
    const ev = [
      ...matchSponsorEvents(qs, answers, '2026-11-10T08:00:00Z'),
      ...matchSponsorEvents(qs, [answers[0]!, answers[1]!, { latencyMs: 3000, correct: false }], '2026-11-10T22:00:00Z'),
    ];
    const r = campaignReport(ev, 'c1');
    expect(r.total).toEqual({ views: 4, answers: 3, correct: 2, correctPct: 66.7 });
    expect(r.byDay.map((d) => d.day)).toEqual(['2026-11-10', '2026-11-11']);
    expect(reportCsv(r.byDay).split('\n')[0]).toBe('day,views,answers,correct,correct_pct');
  });

  it('funding = billable views (within quota) x price per 1,000', () => {
    const views = Array.from({ length: 3000 }, (_, i) => ({
      type: 'view' as const,
      campaignId: 'c1',
      questionId: 'q',
      at: new Date(Date.UTC(2026, 10, 1 + (i % 20))).toISOString(),
    }));
    const c = { id: 'c1', sponsorId: 's', startsAt: '', endsAt: '', viewQuota: 2000, pricePer1000Halalas: 50_000 };
    expect(sponsorFundingForMonth([c], views, '2026-11')).toBe(100_000);
  });
});
