'use client';

import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, LangToggle, Notice, ProductMark, SampleChip } from '@/components/ui';
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
import { ageOn, displayNameValid } from '@/lib/moderation';
import { productName } from '@/lib/product';
import { CITIES, SAMPLE_CODE } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { Player } from '@/lib/types';

const TERMS_VERSION = '1.1';
const PRIVACY_VERSION = '1.1';
const STEPS = ['nafath', 'phone', 'profile', 'iban', 'consents'] as const;
type Step = (typeof STEPS)[number];

/**
 * BRD v1.1 sign-up: Nafath (verified date of birth, 18+ only, FR-01), Saudi mobile + OTP, display name, IBAN verified
 * against the same ID number (FR-04, required at sign-up by default) and versioned consents (FR-02). In the sample
 * version Nafath, the SMS and the IBAN check are simulated.
 */
export function SignIn() {
  const { state } = useStore();
  const { d } = useT();
  const [mode, setMode] = useState<'signin' | 'new'>(state.savedAccount ? 'signin' : 'new');
  return (
    <AuthShell>
      <div role="tablist" className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        {(['signin', 'new'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}
          >
            {m === 'signin' ? d.signin.tabSignIn : d.signin.tabNew}
          </button>
        ))}
      </div>
      {mode === 'signin' ? <ReturningSignIn onNew={() => setMode('new')} /> : <Register />}
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  const { d, locale } = useT();
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ProductMark />
          <span className="text-lg font-bold">{productName(locale)}</span>
          <SampleChip />
        </div>
        <LangToggle />
      </div>
      <Card>{children}</Card>
      <p className="mt-4 text-center text-xs text-muted">{d.common.sampleTip}</p>
    </div>
  );
}

/** A player who registered on this device signs in again with the mobile number (+ code) or Nafath. */
function ReturningSignIn({ onNew }: { onNew: () => void }) {
  const { state, dispatch } = useStore();
  const { d, fill } = useT();
  const [by, setBy] = useState<'phone' | 'nafath'>('phone');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const saved = state.savedAccount;
  const input =
    'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base focus:border-brand';

  function submit() {
    setError('');
    if (by === 'phone') {
      if (!/^5\d{8}$/.test(phone)) return setError(d.signin.phoneInvalid);
      if (!codeSent) return setCodeSent(true);
      if (code !== SAMPLE_CODE) return setError(d.signin.codeInvalid);
      if (!saved || !saved.phoneMasked.endsWith(phone.slice(-3)))
        return setError(d.signin.noAccount);
    } else {
      if (!nationalIdValid(nid)) return setError(d.signin.idInvalid);
      if (!saved || saved.nationalIdMasked !== maskNationalId(nid))
        return setError(d.signin.noAccount);
    }
    dispatch({ type: 'restoreAccount' });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{d.signin.signInTitle}</h1>
        {saved && (
          <p className="text-sm text-muted">{fill(d.signin.savedHint, { name: saved.name })}</p>
        )}
      </div>
      <div className="flex gap-2">
        {(['phone', 'nafath'] as const).map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={by === b}
            onClick={() => {
              setBy(b);
              setError('');
            }}
            className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold ${by === b ? 'border-brand bg-brand/10 text-brand-deep' : 'border-line bg-white'}`}
          >
            {b === 'phone' ? d.signin.byPhone : d.signin.byNafath}
          </button>
        ))}
      </div>
      {by === 'phone' ? (
        <>
          <Field label={d.signin.phoneLabel}>
            <div className="flex gap-2" dir="ltr">
              <span className="grid place-items-center rounded-xl border border-line bg-page px-3 text-muted">
                +966
              </span>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={d.signin.phoneHint}
                value={phone}
                disabled={codeSent}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              />
            </div>
          </Field>
          {codeSent && (
            <>
              <Notice tone="gold">{fill(d.signin.sampleCode, { code: SAMPLE_CODE })}</Notice>
              <Field label={d.signin.codeLabel}>
                <input
                  className={`${input} tabular tracking-[0.4em]`}
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </Field>
            </>
          )}
        </>
      ) : (
        <Field label={d.signin.idLabel} hint={d.signin.idHint}>
          <input
            className={`${input} tabular`}
            dir="ltr"
            inputMode="numeric"
            value={nid}
            onChange={(e) => setNid(e.target.value.replace(/\D/g, '').slice(0, 10))}
          />
        </Field>
      )}
      <Button className="w-full" size="lg" onClick={submit}>
        {by === 'phone' && !codeSent ? d.signin.sendCode : d.signin.signIn}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-medium text-bad">
          {error}{' '}
          {error === d.signin.noAccount && (
            <button type="button" className="font-semibold text-brand underline" onClick={onNew}>
              {d.signin.tabNew}
            </button>
          )}
        </p>
      )}
    </div>
  );
}

function Register() {
  const { state, dispatch } = useStore();
  const { d, fill, pick, date } = useT();
  const [step, setStep] = useState<Step>('nafath');
  const [error, setError] = useState('');
  const now = new Date();

  const [nid, setNid] = useState('');
  const [nafath, setNafath] = useState<{ birthDate: string; matchNumber: number } | null>(null);
  const [verified, setVerified] = useState(false);
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('riyadh');
  const [iban, setIban] = useState('');
  const [ibanState, setIbanState] = useState<'idle' | 'checking' | 'verified'>('idle');
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    location: false,
    marketing: false,
  });
  const ibanRequired = state.ibanRequiredAt === 'signup';

  const fail = (msg: string) => setError(msg);
  const go = (s: Step) => {
    setError('');
    setStep(s);
  };

  function startNafath() {
    if (!nationalIdValid(nid)) return fail(d.signin.idInvalid);
    setNafath(sampleNafath(nid, now));
    setError('');
  }

  function confirmNafath() {
    if (!nafath) return;
    if (ageOn(nafath.birthDate, now) < 18) return fail(d.signin.under18Refused);
    setVerified(true);
    go('phone');
  }

  function verifyPhone() {
    if (!/^5\d{8}$/.test(phone)) return fail(d.signin.phoneInvalid);
    if (!codeSent) {
      setCodeSent(true);
      return setError('');
    }
    if (code !== SAMPLE_CODE) return fail(d.signin.codeInvalid);
    go('profile');
  }

  function saveProfile() {
    if (!displayNameValid(name)) return fail(d.signin.nameInvalid);
    go('iban');
  }

  function checkIban() {
    if (!ibanValid(iban)) return fail(d.signin.ibanInvalid);
    setError('');
    setIbanState('checking');
    setTimeout(() => setIbanState('verified'), 1200);
  }

  function create() {
    if (!consents.terms || !consents.privacy) return fail(d.signin.consentRequired);
    if (!nafath || !verified) return go('nafath');
    const at = now.toISOString();
    const player: Player = {
      id: 'me',
      name: name.trim(),
      phoneMasked: `+966 5•• ••• ${phone.slice(-3)}`,
      birthDate: nafath.birthDate,
      nationalIdMasked: maskNationalId(nid),
      iban: ibanState === 'verified' ? { masked: maskIban(iban), verifiedAt: at } : null,
      cityId: city,
      rating: 1200,
      createdAt: at,
      consents: [
        { type: 'terms', version: TERMS_VERSION, grantedAt: at },
        { type: 'privacy', version: PRIVACY_VERSION, grantedAt: at },
        ...(consents.location
          ? [{ type: 'location' as const, version: PRIVACY_VERSION, grantedAt: at }]
          : []),
        ...(consents.marketing
          ? [{ type: 'marketing' as const, version: PRIVACY_VERSION, grantedAt: at }]
          : []),
      ],
    };
    dispatch({ type: 'signIn', player });
  }

  const input =
    'w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base focus:border-brand';
  const stepIndex = STEPS.indexOf(step);

  return (
    <>
      <h1 className="text-xl font-bold">{d.signin.title}</h1>
      <ol className="my-4 flex gap-1.5" aria-label={d.signin.title}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span
              className={`block h-1.5 rounded-full ${i <= stepIndex ? 'bg-brand' : 'bg-slate-200'}`}
            />
            <span
              className={`mt-1 block truncate text-[11px] ${i === stepIndex ? 'font-semibold text-ink' : 'text-muted'}`}
            >
              {d.signin.steps[s]}
            </span>
          </li>
        ))}
      </ol>

      {step === 'nafath' && (
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
              className={`${input} tabular`}
              dir="ltr"
              inputMode="numeric"
              value={nid}
              disabled={Boolean(nafath)}
              onChange={(e) => setNid(e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </Field>
          {!nafath ? (
            <>
              <Button className="w-full" size="lg" onClick={startNafath}>
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
                <p className="tabular my-2 text-4xl font-black text-[#0e7a5a]">
                  {nafath.matchNumber}
                </p>
                <p className="text-xs text-muted">
                  {fill(d.signin.dobFromNafath, { date: date(`${nafath.birthDate}T12:00:00Z`) })}
                </p>
              </div>
              <Button className="w-full" size="lg" onClick={confirmNafath}>
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
          <p className="text-xs text-muted">{d.signin.nafathSample}</p>
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          <Badge tone="ok">{d.signin.nafathVerified}</Badge>
          <Field label={d.signin.phoneLabel}>
            <div className="flex gap-2" dir="ltr">
              <span className="grid place-items-center rounded-xl border border-line bg-page px-3 text-muted">
                +966
              </span>
              <input
                className={input}
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder={d.signin.phoneHint}
                value={phone}
                disabled={codeSent}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
              />
            </div>
          </Field>
          {codeSent && (
            <>
              <Notice tone="gold">{fill(d.signin.sampleCode, { code: SAMPLE_CODE })}</Notice>
              <Field label={d.signin.codeLabel}>
                <input
                  className={`${input} tabular tracking-[0.4em]`}
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </Field>
            </>
          )}
          <Button className="w-full" size="lg" onClick={verifyPhone}>
            {codeSent ? d.signin.verify : d.signin.sendCode}
          </Button>
        </div>
      )}

      {step === 'profile' && (
        <div className="space-y-4">
          <Field label={d.signin.nameLabel} hint={d.signin.nameHint}>
            <input
              className={input}
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label={d.signin.cityLabel}>
            <select className={input} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.name)}
                </option>
              ))}
            </select>
          </Field>
          <Button className="w-full" size="lg" onClick={saveProfile}>
            {d.signin.next}
          </Button>
        </div>
      )}

      {step === 'iban' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">{d.signin.ibanWhy}</p>
          <Field label={d.signin.ibanLabel} hint={d.signin.ibanHint}>
            <input
              className={`${input} tabular uppercase`}
              dir="ltr"
              value={iban}
              disabled={ibanState !== 'idle'}
              onChange={(e) => setIban(normalizeIban(e.target.value).slice(0, 24))}
            />
          </Field>
          {ibanState === 'idle' && (
            <>
              <Button className="w-full" size="lg" onClick={checkIban}>
                {d.signin.ibanVerify}
              </Button>
              <button
                type="button"
                className="text-xs font-semibold text-brand"
                onClick={() => setIban(makeIban('80', nid.slice(-6) + '010167'))}
              >
                {d.signin.fillSample}
              </button>
            </>
          )}
          {ibanState === 'checking' && <Notice>{d.signin.ibanChecking}</Notice>}
          {ibanState === 'verified' && (
            <>
              <Notice tone="gold">
                {fill(d.signin.ibanVerified, { id: maskNationalId(nid) })}
              </Notice>
              <Button className="w-full" size="lg" onClick={() => go('consents')}>
                {d.signin.next}
              </Button>
            </>
          )}
          {!ibanRequired && ibanState !== 'verified' && (
            <Button variant="ghost" className="w-full" onClick={() => go('consents')}>
              {d.signin.ibanLater}
            </Button>
          )}
          <p className="text-xs text-muted">{d.signin.ibanSample}</p>
        </div>
      )}

      {step === 'consents' && (
        <div className="space-y-4">
          <fieldset className="space-y-2.5">
            <legend className="mb-1 text-sm font-medium">{d.signin.consentsTitle}</legend>
            {(
              [
                ['terms', fill(d.signin.consentTerms, { v: TERMS_VERSION })],
                ['privacy', fill(d.signin.consentPrivacy, { v: PRIVACY_VERSION })],
                ['location', d.signin.consentLocation],
                ['marketing', d.signin.consentMarketing],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-brand"
                  checked={consents[key]}
                  onChange={(e) => setConsents({ ...consents, [key]: e.target.checked })}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>
          <Button className="w-full" size="lg" onClick={create}>
            {d.signin.create}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
