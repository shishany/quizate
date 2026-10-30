'use client';

import { useState } from 'react';
import { Button, Card, LangToggle, Notice, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { ageOn, displayNameValid } from '@/lib/moderation';
import { productName } from '@/lib/product';
import { CITIES, SAMPLE_CODE } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { Player } from '@/lib/types';

const TERMS_VERSION = '1.0';
const PRIVACY_VERSION = '1.0';

/** FR-01, FR-02: Saudi mobile + one-time code, then display name, date of birth, city and versioned consents. */
export function SignIn() {
  const { dispatch } = useStore();
  const { d, locale, fill, pick } = useT();
  const [step, setStep] = useState<'phone' | 'code' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState('riyadh');
  const [consents, setConsents] = useState({
    terms: false,
    privacy: false,
    location: false,
    marketing: false,
  });

  const now = new Date();
  const age = dob ? ageOn(dob, now) : null;

  function send() {
    if (!/^5\d{8}$/.test(phone)) return setError(d.signin.phoneInvalid);
    setError('');
    setStep('code');
  }

  function verify() {
    if (code.trim() !== SAMPLE_CODE) return setError(d.signin.codeInvalid);
    setError('');
    setStep('profile');
  }

  function create() {
    if (!displayNameValid(name)) return setError(d.signin.nameInvalid);
    if (age === null || age < 13) return setError(d.signin.under13);
    if (!consents.terms || !consents.privacy) return setError(d.signin.consentRequired);
    const at = now.toISOString();
    const player: Player = {
      id: 'me',
      name: name.trim(),
      phoneMasked: `+966 5•• ••• ${phone.slice(-3)}`,
      birthDate: dob,
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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ProductMark />
          <span className="text-lg font-bold">{productName(locale)}</span>
          <SampleChip />
        </div>
        <LangToggle />
      </div>

      <Card>
        <h1 className="mb-1 text-xl font-bold">{d.signin.title}</h1>
        <p className="mb-5 text-sm text-muted">
          {step === 'profile' ? d.signin.stepProfile : d.signin.stepPhone}
        </p>

        {step !== 'profile' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{d.signin.phoneLabel}</span>
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
                  disabled={step === 'code'}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                />
              </div>
            </label>
            {step === 'phone' && (
              <Button className="w-full" size="lg" onClick={send}>
                {d.signin.sendCode}
              </Button>
            )}
            {step === 'code' && (
              <>
                <Notice tone="gold">{fill(d.signin.sampleCode, { code: SAMPLE_CODE })}</Notice>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium">{d.signin.codeLabel}</span>
                  <input
                    className={`${input} tabular tracking-[0.4em]`}
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </label>
                <Button className="w-full" size="lg" onClick={verify}>
                  {d.signin.verify}
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{d.signin.nameLabel}</span>
              <input
                className={input}
                value={name}
                maxLength={20}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="mt-1 block text-xs text-muted">{d.signin.nameHint}</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{d.signin.dobLabel}</span>
              <input
                className={input}
                type="date"
                value={dob}
                max={now.toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
              />
            </label>
            {age !== null && age < 13 && <Notice tone="bad">{d.signin.under13}</Notice>}
            {age !== null && age >= 13 && age < 18 && (
              <Notice tone="warn">{d.signin.under18}</Notice>
            )}
            <label className="block">
              <span className="mb-1 block text-sm font-medium">{d.signin.cityLabel}</span>
              <select className={input} value={city} onChange={(e) => setCity(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {pick(c.name)}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="space-y-2">
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
                    className="mt-0.5 h-4 w-4 accent-brand"
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
      </Card>
      <p className="mt-4 text-center text-xs text-muted">{d.common.sampleTip}</p>
    </div>
  );
}
