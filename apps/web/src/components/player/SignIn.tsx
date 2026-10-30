'use client';

import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, LangToggle, Notice, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { Field, IbanVerify, NafathVerify, inputClass } from '@/components/player/Verify';
import { maskNationalId, nationalIdValid } from '@/lib/identity';
import { ageOn, displayNameValid } from '@/lib/moderation';
import { productName } from '@/lib/product';
import { CITIES, SAMPLE_CODE } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { Player } from '@/lib/types';

const TERMS_VERSION = '1.1';
const PRIVACY_VERSION = '1.1';
/** Minimum age to play, declared at mobile sign-up; Nafath verifies it before payments (BR-15). BRD v1.1: 18. */
const MIN_AGE = 18;

/**
 * Sign-up and sign-in. In the sample version Nafath, the SMS and the IBAN check are simulated (architecture rule 12).
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

type Method = 'phone' | 'nafath';
type Step = 'method' | 'nafath' | 'phone' | 'profile' | 'iban' | 'consents';
const STEPS: Record<Method, Step[]> = {
  phone: ['phone', 'profile', 'consents'],
  nafath: ['nafath', 'phone', 'profile', 'iban', 'consents'],
};

/**
 * Registration (owner decision, 2026-10-30): anyone with a Saudi mobile number can play. Nafath is the identity check
 * for payments: available at sign-up, or later from the account page, and required before the prize ranking (or
 * earlier, per `identity.iban_required_at`). With a mobile number the date of birth is declared.
 */
function Register() {
  const { state, dispatch } = useStore();
  const { d, fill, pick } = useT();
  const forceNafath = state.ibanRequiredAt === 'signup';
  const [method, setMethod] = useState<Method | null>(forceNafath ? 'nafath' : null);
  const [step, setStep] = useState<Step>(forceNafath ? 'nafath' : 'method');
  const [error, setError] = useState('');
  const now = new Date();

  const [identity, setIdentity] = useState<{
    nationalId: string;
    nationalIdMasked: string;
    birthDate: string;
  } | null>(null);
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('riyadh');
  const [dob, setDob] = useState('');
  const [iban, setIban] = useState<string | null>(null);
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    location: false,
    marketing: false,
  });

  const go = (s: Step) => {
    setError('');
    setStep(s);
  };
  const steps = method ? STEPS[method] : [];
  const next = () => go(steps[steps.indexOf(step) + 1] ?? 'consents');

  function choose(m: Method) {
    setMethod(m);
    go(STEPS[m][0] as Step);
  }

  function verifyPhone() {
    if (!/^5\d{8}$/.test(phone)) return setError(d.signin.phoneInvalid);
    if (!codeSent) {
      setCodeSent(true);
      return setError('');
    }
    if (code !== SAMPLE_CODE) return setError(d.signin.codeInvalid);
    next();
  }

  function saveProfile() {
    if (!displayNameValid(name)) return setError(d.signin.nameInvalid);
    if (!identity) {
      if (!dob) return setError(d.signin.dobRequired);
      if (ageOn(dob, now) < MIN_AGE) return setError(fill(d.signin.underMinAge, { n: MIN_AGE }));
    }
    next();
  }

  function create() {
    if (!consents.terms || !consents.privacy) return setError(d.signin.consentRequired);
    const at = now.toISOString();
    const player: Player = {
      id: 'me',
      name: name.trim(),
      phoneMasked: `+966 5•• ••• ${phone.slice(-3)}`,
      birthDate: identity?.birthDate ?? dob,
      dobSource: identity ? 'nafath' : 'declared',
      nationalIdMasked: identity?.nationalIdMasked ?? null,
      identityVerifiedAt: identity ? at : null,
      iban: iban ? { masked: iban, verifiedAt: at } : null,
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

  return (
    <>
      <h1 className="text-xl font-bold">{d.signin.title}</h1>
      {method && (
        <ol className="my-4 flex gap-1.5" aria-label={d.signin.title}>
          {steps.map((s, i) => (
            <li key={s} className="flex-1">
              <span
                className={`block h-1.5 rounded-full ${i <= steps.indexOf(step) ? 'bg-brand' : 'bg-slate-200'}`}
              />
              <span
                className={`mt-1 block truncate text-[11px] ${s === step ? 'font-semibold text-ink' : 'text-muted'}`}
              >
                {d.signin.steps[s as keyof typeof d.signin.steps]}
              </span>
            </li>
          ))}
        </ol>
      )}

      {step === 'method' && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted">{d.signin.methodIntro}</p>
          <button
            type="button"
            onClick={() => choose('phone')}
            className="w-full rounded-2xl border-2 border-brand bg-brand/5 p-4 text-start hover:bg-brand/10"
          >
            <span className="block font-bold text-brand-deep">{d.signin.methodPhone}</span>
            <span className="mt-0.5 block text-sm text-muted">{d.signin.methodPhoneBody}</span>
          </button>
          <button
            type="button"
            onClick={() => choose('nafath')}
            className="w-full rounded-2xl border-2 border-[#0e7a5a]/40 bg-[#e9f6f1] p-4 text-start hover:border-[#0e7a5a]"
          >
            <span className="block font-bold text-[#0b5a43]">{d.signin.methodNafath}</span>
            <span className="mt-0.5 block text-sm text-[#0b5a43]/80">
              {d.signin.methodNafathBody}
            </span>
          </button>
        </div>
      )}

      {step === 'nafath' && (
        <NafathVerify
          onVerified={(v) => {
            setIdentity(v);
            next();
          }}
        />
      )}

      {step === 'phone' && (
        <div className="space-y-4">
          {identity && <Badge tone="ok">{d.signin.nafathVerified}</Badge>}
          <Field label={d.signin.phoneLabel}>
            <div className="flex gap-2" dir="ltr">
              <span className="grid place-items-center rounded-xl border border-line bg-page px-3 text-muted">
                +966
              </span>
              <input
                className={inputClass}
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
                  className={`${inputClass} tabular tracking-[0.4em]`}
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
              className={inputClass}
              value={name}
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {!identity && (
            <Field label={d.signin.dobLabel} hint={d.signin.dobHint}>
              <input
                className={inputClass}
                type="date"
                value={dob}
                max={now.toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
              />
            </Field>
          )}
          <Field label={d.signin.cityLabel}>
            <select className={inputClass} value={city} onChange={(e) => setCity(e.target.value)}>
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

      {step === 'iban' && identity && (
        <IbanVerify
          nationalId={identity.nationalId}
          nationalIdMasked={identity.nationalIdMasked}
          onVerified={(masked) => {
            setIban(masked);
            next();
          }}
          onLater={forceNafath ? undefined : next}
        />
      )}

      {step === 'consents' && (
        <div className="space-y-4">
          {!identity && <Notice>{d.signin.verifyLaterNote}</Notice>}
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

      {method && !forceNafath && step !== 'consents' && (
        <button
          type="button"
          className="mt-3 text-xs font-semibold text-muted"
          onClick={() => {
            setMethod(null);
            go('method');
          }}
        >
          {d.signin.changeMethod}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-bad">
          {error}
        </p>
      )}
    </>
  );
}
