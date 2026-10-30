'use client';

import { useState, type ReactNode } from 'react';
import { Button, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import {
  ibanValid,
  makeIban,
  maskIban,
  maskNationalId,
  nationalIdValid,
  normalizeIban,
  sampleNafath,
} from '@/lib/identity';
import { ageOn } from '@/lib/moderation';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base focus:border-brand';

/**
 * Nafath (simulated): ID → number match in the Nafath app → verified date of birth. Under-18 is refused (BR-15,
 * NFR-12). Used at registration and later from the account page, before payments.
 */
export function NafathVerify({
  onVerified,
}: {
  onVerified: (v: { nationalId: string; nationalIdMasked: string; birthDate: string }) => void;
}) {
  const { d, fill, date } = useT();
  const [nid, setNid] = useState('');
  const [nafath, setNafath] = useState<{ birthDate: string; matchNumber: number } | null>(null);
  const [error, setError] = useState('');

  function start() {
    if (!nationalIdValid(nid)) return setError(d.signin.idInvalid);
    setError('');
    setNafath(sampleNafath(nid, new Date()));
  }

  function confirm() {
    if (!nafath) return;
    if (ageOn(nafath.birthDate, new Date()) < 18) return setError(d.signin.under18Refused);
    onVerified({
      nationalId: nid,
      nationalIdMasked: maskNationalId(nid),
      birthDate: nafath.birthDate,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-[#e9f6f1] p-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0e7a5a] text-sm font-bold text-white"
          aria-hidden
        >
          {d.signin.nafathShort}
        </span>
        <p className="text-sm text-[#0b5a43]">{d.signin.nafathBody}</p>
      </div>
      <Field label={d.signin.idLabel} hint={d.signin.idHint}>
        <input
          className={`${inputClass} tabular`}
          dir="ltr"
          inputMode="numeric"
          value={nid}
          disabled={Boolean(nafath)}
          onChange={(e) => setNid(e.target.value.replace(/\D/g, '').slice(0, 10))}
        />
      </Field>
      {!nafath ? (
        <>
          <Button className="w-full" size="lg" onClick={start}>
            {d.signin.nafathStart}
          </Button>
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => setNid('1012345678')}
          >
            {d.signin.fillSample}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-line p-4 text-center">
            <p className="text-sm text-muted">{d.signin.nafathPick}</p>
            <p className="tabular my-2 text-4xl font-black text-[#0e7a5a]">{nafath.matchNumber}</p>
            <p className="text-xs text-muted">
              {fill(d.signin.dobFromNafath, { date: date(`${nafath.birthDate}T12:00:00Z`) })}
            </p>
          </div>
          <Button className="w-full" size="lg" onClick={confirm}>
            {d.signin.nafathConfirm}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setNafath(null);
              setError('');
            }}
          >
            {d.common.back}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">{d.signin.nafathSample}</p>
    </div>
  );
}

/** IBAN (FR-04): format and mod-97 check, then a simulated ownership check against the verified ID number. */
export function IbanVerify({
  nationalId,
  nationalIdMasked,
  onVerified,
  onLater,
}: {
  nationalId: string | null;
  nationalIdMasked: string;
  onVerified: (masked: string) => void;
  onLater?: () => void;
}) {
  const { d, fill } = useT();
  const [iban, setIban] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'verified'>('idle');
  const [error, setError] = useState('');

  function check() {
    if (!ibanValid(iban)) return setError(d.signin.ibanInvalid);
    setError('');
    setState('checking');
    setTimeout(() => setState('verified'), 1200);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{d.signin.ibanWhy}</p>
      <Field label={d.signin.ibanLabel} hint={d.signin.ibanHint}>
        <input
          className={`${inputClass} tabular uppercase`}
          dir="ltr"
          value={iban}
          disabled={state !== 'idle'}
          onChange={(e) => setIban(normalizeIban(e.target.value).slice(0, 24))}
        />
      </Field>
      {state === 'idle' && (
        <>
          <Button className="w-full" size="lg" onClick={check}>
            {d.signin.ibanVerify}
          </Button>
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => setIban(makeIban('80', (nationalId ?? '000000').slice(-6) + '010167'))}
          >
            {d.signin.fillSample}
          </button>
        </>
      )}
      {state === 'checking' && <Notice>{d.signin.ibanChecking}</Notice>}
      {state === 'verified' && (
        <>
          <Notice tone="gold">{fill(d.signin.ibanVerified, { id: nationalIdMasked })}</Notice>
          <Button className="w-full" size="lg" onClick={() => onVerified(maskIban(iban))}>
            {d.signin.next}
          </Button>
        </>
      )}
      {onLater && state !== 'verified' && (
        <Button variant="ghost" className="w-full" onClick={onLater}>
          {d.signin.ibanLater}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}
        </p>
      )}
      <p className="text-xs text-muted">{d.signin.ibanSample}</p>
    </div>
  );
}
