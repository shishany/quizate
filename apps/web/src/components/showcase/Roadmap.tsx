'use client';

import { FEATURE_FLAGS, isOn, type FeatureFlag } from '@quizate/game';
import { PhaseBadge, SCard } from '@/components/showcase/ui';
import { useShowcase } from '@/lib/showcase/context';
import { useS } from '@/lib/showcase/i18n';
import { PHASE2_FLAGS, PHASE3_ITEMS, VIEW_ONLY, phaseOf, phaseRank } from '@/lib/showcase/phases';

const MVP_FLAGS = (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter((f) => FEATURE_FLAGS[f]);

/** Features by phase. The chosen phase switches its features on for this session (showcase only). */
export function Roadmap() {
  const { s } = useS();
  const { phase, flags } = useShowcase();
  const shown = MVP_FLAGS.filter((f) => f in s.features) as (keyof typeof s.features)[];
  const row = (f: FeatureFlag, title: string, body: string) => {
    const on = isOn(f, flags);
    return (
      <li
        key={f}
        className={`rounded-xl border p-3 ${on ? 'border-primary/30 bg-card' : 'border-line bg-bg opacity-70'}`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold">{title}</span>
          <PhaseBadge phase={phaseOf(f)} />
          <span
            className={`ms-auto text-[11px] font-semibold ${on ? 'text-primary' : 'text-muted'}`}
          >
            {on ? (VIEW_ONLY.includes(f) ? s.viewOnly : s.on) : s.off}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </li>
    );
  };
  return (
    <SCard title={s.roadmap}>
      <div data-tour="roadmap">
        <p className="mb-3 text-xs text-muted">{s.roadmapNote}</p>
        <h3 className="mb-2 text-sm font-bold">{s.mvpFeatures}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {shown.map((f) => row(f, s.features[f][0]!, s.features[f][1]!))}
        </ul>
        <h3 className="mb-2 mt-4 text-sm font-bold">{s.phases.p2}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PHASE2_FLAGS.map((f) => row(f, s.features[f][0]!, s.features[f][1]!))}
        </ul>
        <h3 className="mb-2 mt-4 text-sm font-bold">{s.phases.p3}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {PHASE3_ITEMS.map((k) => (
            <li
              key={k}
              className={`rounded-xl border border-dashed p-3 ${phaseRank(phase) >= 2 ? 'border-ink/40 bg-card' : 'border-line bg-bg opacity-70'}`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold">{s.phase3[k][0]}</span>
                <PhaseBadge phase="p3" />
                <span className="ms-auto text-[11px] font-semibold text-muted">{s.soon}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{s.phase3[k][1]}</p>
            </li>
          ))}
        </ul>
      </div>
    </SCard>
  );
}
