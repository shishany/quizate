'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useShowcase } from '@/lib/showcase/context';
import { useS } from '@/lib/showcase/i18n';
import { TOUR_STEPS } from '@/lib/showcase/tour';

const fill = (t: string, v: Record<string, string>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
const PAD = 8;

/**
 * Guided tour: dims the page, spotlights the step's element and shows a card at the bottom (phone first).
 * Moves between showcase pages as needed; Escape ends it.
 */
export function Tour() {
  const { s } = useS();
  const { tourStep, setTourStep } = useShowcase();
  const router = useRouter();
  const path = usePathname();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const step = tourStep === null ? null : TOUR_STEPS[tourStep];

  // Go to the step's page.
  useEffect(() => {
    if (step && path !== step.path) router.push(step.path);
  }, [step, path, router]);

  // Find the target (it may render after navigation), scroll it into view and follow scroll/resize.
  useLayoutEffect(() => {
    if (!step || path !== step.path) return setRect(null);
    let tries = 0;
    let el: Element | null = null;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const measure = () => setRect(el ? el.getBoundingClientRect() : null);
    const find = window.setInterval(() => {
      el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el || ++tries > 20) {
        window.clearInterval(find);
        el?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        window.setTimeout(measure, reduce ? 0 : 350);
      }
    }, 100);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      window.clearInterval(find);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  }, [step, path]);

  useEffect(() => {
    if (tourStep === null) return;
    card.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setTourStep(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tourStep, setTourStep]);

  if (tourStep === null || !step) return null;
  const last = tourStep === TOUR_STEPS.length - 1;
  const [title, body] = s.tour.steps[step.id];

  return (
    <div className="fixed inset-0 z-50" aria-live="polite">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-2xl ring-4 ring-highlight transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(22, 23, 28, 0.62)',
          }}
        />
      ) : (
        <div aria-hidden className="fixed inset-0 bg-ink/60" />
      )}
      <div
        ref={card}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-x-3 bottom-3 mx-auto max-w-md rounded-2xl bg-card p-4 shadow-xl outline-none"
      >
        <div className="text-xs font-semibold text-muted">
          {fill(s.tour.of, { i: String(tourStep + 1), n: String(TOUR_STEPS.length) })}
        </div>
        <h2 className="mt-1 text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm">{body}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted"
            onClick={() => setTourStep(null)}
          >
            {s.tour.skip}
          </button>
          {tourStep > 0 && (
            <button
              type="button"
              className="ms-auto rounded-lg border border-line px-3 py-2 text-sm font-semibold"
              onClick={() => setTourStep(tourStep - 1)}
            >
              {s.tour.back}
            </button>
          )}
          <button
            type="button"
            className={`${tourStep > 0 ? '' : 'ms-auto'} rounded-xl bg-action-strong px-4 py-2 text-sm font-semibold text-white`}
            onClick={() => setTourStep(last ? null : tourStep + 1)}
          >
            {last ? s.tour.done : s.tour.next}
          </button>
        </div>
      </div>
    </div>
  );
}
