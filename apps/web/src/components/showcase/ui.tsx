'use client';

import type { ReactNode } from 'react';
import type { Phase } from '@/lib/showcase/phases';
import { useS } from '@/lib/showcase/i18n';

/** Marks everything simulated in the showcase. */
export function DemoChip({ className = '' }: { className?: string }) {
  const { s } = useS();
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full bg-info px-2.5 py-0.5 text-[11px] font-semibold text-ink ${className}`}
    >
      {s.demoData}
    </span>
  );
}

const PHASE_TONE: Record<Phase, string> = {
  mvp: 'bg-primary text-white',
  p2: 'bg-highlight text-ink',
  p3: 'bg-ink text-white',
};

/** Small badge naming the phase a feature belongs to. */
export function PhaseBadge({ phase }: { phase: Phase }) {
  const { s } = useS();
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${PHASE_TONE[phase]}`}
    >
      {s.phases[phase]}
    </span>
  );
}

/** Showcase card on the Sabbaq tokens (`card` background, `line` border). The app's own Card stays unchanged. */
export function SCard({
  title,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-card p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-base font-bold text-ink">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
