'use client';

import { MATCH_CATEGORIES, halalasToSar, riyadhMonthKey } from '@quizate/game';
import { DemoChip, SCard } from '@/components/showcase/ui';
import { SAMPLE_SPONSORS, sampleCampaigns } from '@/data/sponsors';
import { useT } from '@/i18n';
import { useShowcase } from '@/lib/showcase/context';
import { useS } from '@/lib/showcase/i18n';
import { impactOf } from '@/lib/showcase/impact';
import { fundingForMonth } from '@/lib/sponsorship';
import { useStore } from '@/lib/store';

const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

export default function ShowcaseImpact() {
  const { s, lang } = useS();
  const { num } = useT();
  const { sim } = useShowcase();
  const { state } = useStore();
  const im = impactOf(sim);
  const now = new Date();
  const funding = fundingForMonth(
    sampleCampaigns(now, {}, state.config.sponsor.defaultPricePer1000Halalas),
    [],
    riyadhMonthKey(now),
    now,
  );
  const name = (id: string) => MATCH_CATEGORIES.find((c) => c.id === id)?.name[lang] ?? id;
  const tiles = [
    [s.impact.questions, im.questionsAnswered],
    [s.impact.players, im.playersReached],
    [s.impact.cities, im.cities],
    [s.impact.youth, im.youthEngaged],
  ] as const;
  const goals = [
    [s.impact.goalKnowledge, { q: num(im.questionsAnswered), c: num(im.byCategory.length) }],
    [s.impact.goalReach, { p: num(im.playersReached), n: num(im.cities), y: num(im.youthEngaged) }],
    [s.impact.goalSupport, { s: num(SAMPLE_SPONSORS.length), f: halalasToSar(funding) }],
  ] as const;

  return (
    <>
      <section className="rounded-2xl bg-primary p-5 text-white">
        <h1 className="text-2xl font-bold">{s.impact.title}</h1>
        <p className="mt-1 text-sm text-white/90">{s.impact.intro}</p>
      </section>
      <div data-tour="impact" className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {tiles.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-card p-3 text-center shadow-sm">
              <div className="tabular text-2xl font-bold text-primary">{num(value)}</div>
              <div className="text-xs text-muted">{label}</div>
            </div>
          ))}
        </div>
        <DemoChip />
        <SCard title={s.impact.goals}>
          <ul className="space-y-2">
            {goals.map(([[title, body], v]) => (
              <li key={title} className="rounded-xl border-s-4 border-highlight bg-bg p-3">
                <div className="font-bold">{title}</div>
                <p className="text-sm text-muted">{fill(body ?? '', v)}</p>
              </li>
            ))}
          </ul>
        </SCard>
        <SCard title={s.impact.categories} action={<DemoChip />}>
          <ul className="space-y-2 text-sm">
            {im.byCategory.map((c) => (
              <li key={c.id}>
                <div className="mb-1 flex justify-between">
                  <span>{name(c.id)}</span>
                  <span className="tabular text-muted">{num(Math.round(c.share * 100))}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-bg">
                  <div
                    className="h-2.5 rounded-full bg-primary"
                    style={{ width: `${c.share * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SCard>
      </div>
    </>
  );
}
