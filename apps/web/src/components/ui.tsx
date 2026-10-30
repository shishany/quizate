'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useT } from '@/i18n';
import { useStore } from '@/lib/store';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-sm hover:opacity-95 disabled:opacity-50',
  secondary: 'border border-line bg-white text-ink hover:bg-slate-50 disabled:opacity-50',
  ghost: 'text-brand hover:bg-brand/5 disabled:opacity-50',
  danger: 'border border-bad/30 bg-white text-bad hover:bg-bad-bg disabled:opacity-50',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3.5 text-base',
  };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-not-allowed ${sizes[size]} ${VARIANTS[variant]} ${className}`}
    />
  );
}

export function Card({
  children,
  className = '',
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-line/70 bg-white p-4 shadow-[0_1px_3px_rgba(11,34,56,0.06)] sm:p-5 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

type Tone = 'neutral' | 'ok' | 'bad' | 'warn' | 'brand' | 'gold' | 'violet';
const TONES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  ok: 'bg-ok-bg text-ok',
  bad: 'bg-bad-bg text-bad',
  warn: 'bg-warn-bg text-warn',
  brand: 'bg-brand/10 text-brand-deep',
  gold: 'bg-gold/15 text-gold-ink',
  violet: 'bg-violet-bg text-violet',
};

export function Badge({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SampleChip() {
  const { d } = useT();
  return (
    <span
      title={d.common.sampleTip}
      aria-label={`${d.common.sample}. ${d.common.sampleTip}`}
      className="inline-flex cursor-help items-center whitespace-nowrap rounded-full bg-violet-bg px-2.5 py-0.5 text-xs font-semibold text-violet"
    >
      {d.common.sample}
    </span>
  );
}

export function LangToggle({ className = '' }: { className?: string }) {
  const { state, dispatch } = useStore();
  const { d } = useT();
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: 'locale', locale: state.locale === 'ar' ? 'en' : 'ar' })}
      className={`rounded-full border border-line bg-white px-3 py-1 text-sm font-medium hover:bg-slate-50 ${className}`}
      lang={state.locale === 'ar' ? 'en' : 'ar'}
    >
      {d.common.switchLang}
    </button>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-page px-3 py-2.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="tabular text-lg font-bold">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function Progress({
  value,
  max,
  tone = 'brand',
  label,
}: {
  value: number;
  max: number;
  tone?: 'brand' | 'gold' | 'ok';
  label: string;
}) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const color = { brand: 'bg-brand', gold: 'bg-gold', ok: 'bg-ok' }[tone];
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className="h-2.5 overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={`h-full rounded-full ${color} transition-[width] duration-200`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: { id: T; label: string }[];
}) {
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-slate-100 p-1">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          role="tab"
          aria-selected={value === it.id}
          onClick={() => onChange(it.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${value === it.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Notice({
  tone = 'brand',
  children,
}: {
  tone?: 'brand' | 'warn' | 'bad' | 'gold';
  children: ReactNode;
}) {
  const tones = {
    brand: 'border-brand/20 bg-brand/5 text-brand-deep',
    warn: 'border-warn/25 bg-warn-bg text-warn',
    bad: 'border-bad/25 bg-bad-bg text-bad',
    gold: 'border-gold/40 bg-gold/10 text-gold-ink',
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Loading() {
  const { d } = useT();
  return <div className="grid min-h-[50vh] place-items-center text-muted">{d.common.loading}</div>;
}

export function ProductMark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span
      className={`grid place-items-center rounded-xl bg-brand-gradient font-black text-white ${size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-9 w-9 text-lg'}`}
      aria-hidden
    >
      ؟
    </span>
  );
}
