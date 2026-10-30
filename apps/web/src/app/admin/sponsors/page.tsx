'use client';

import { seededRng } from '@quizate/game';
import { Badge, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { CITIES } from '@/lib/sample';
import { useStore } from '@/lib/store';
import { SAMPLE_CAMPAIGN_ID } from '@/data/questions';

/** Small cells are hidden in every sponsor report (architecture rule 8, build prompt 9). */
const MIN_CELL = 20;

/** FR-16, FR-17: one sample campaign and its aggregated report. Sponsors never see personal data. */
export default function SponsorsPage() {
  const { state } = useStore();
  const { d, fill, num, pick, date } = useT();
  const questions = state.questions.filter((q) => q.campaignId === SAMPLE_CAMPAIGN_ID);
  const rng = seededRng(4242);
  const rows = CITIES.map((c, i) => {
    const impressions = i < 7 ? Math.round(60 + rng() * 900) : Math.round(rng() * 18);
    const answers = Math.round(impressions * (0.9 + rng() * 0.08));
    const correct = Math.round(answers * (0.55 + rng() * 0.3));
    return { city: c, impressions, answers, correct };
  });
  const now = new Date();
  const start = new Date(now.getTime() - 12 * 86_400_000).toISOString();
  const end = new Date(now.getTime() + 18 * 86_400_000).toISOString();
  const cell = (n: number) =>
    n < MIN_CELL ? (
      <span className="text-muted">{fill(d.sponsors.suppressed, { n: num(MIN_CELL) })}</span>
    ) : (
      num(n)
    );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.sponsors.title}</h1>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs text-muted">{d.sponsors.campaign}</div>
            <div className="text-lg font-bold">{d.sponsors.campaignName}</div>
            <div className="text-sm text-muted">
              {d.sponsors.sponsor}: {d.sponsors.sponsorName}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge tone="ok">{d.sponsors.live}</Badge>
            <Badge tone="violet">{d.common.sample}</Badge>
          </div>
        </div>
        <p className="mt-2 text-sm">
          <span className="text-muted">{d.sponsors.dates}: </span>
          {date(start)} – {date(end)}
        </p>
        <div className="mt-3">
          <div className="mb-1 text-sm font-medium">{d.sponsors.questions}</div>
          <ul className="space-y-1 text-sm">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg bg-page px-3 py-1.5">
                {pick(q.text)}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card title={d.sponsors.report} className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-xs text-muted">
            <tr>
              {[
                d.sponsors.city,
                d.sponsors.impressions,
                d.sponsors.answers,
                d.sponsors.correctPct,
              ].map((h) => (
                <th key={h} className="py-2 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.city.id}>
                <td className="py-2">{pick(r.city.name)}</td>
                <td className="py-2">{cell(r.impressions)}</td>
                <td className="py-2">{cell(r.answers)}</td>
                <td className="py-2">
                  {r.answers < MIN_CELL
                    ? '—'
                    : `${num(Math.round((r.correct / r.answers) * 100))}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">
          {fill(d.sponsors.suppressedNote, { n: num(MIN_CELL) })}
        </p>
        <p className="mt-1 text-xs text-muted">
          {fill(d.sponsors.yours, {
            i: num(state.sponsorTally.impressions),
            a: num(state.sponsorTally.answers),
          })}
        </p>
      </Card>
    </div>
  );
}
