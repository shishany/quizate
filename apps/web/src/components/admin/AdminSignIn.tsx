'use client';

import { useState } from 'react';
import { Button, Card, LangToggle, Notice, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { productName } from '@/lib/product';
import { ADMIN_USERS, SAMPLE_CODE } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { AdminRole } from '@/lib/types';

/** FR-25: admin sign-in with a mandatory second factor. The sample shows the code; production uses TOTP. */
export function AdminSignIn() {
  const { dispatch } = useStore();
  const { d, fill, pick } = useT();
  const [role, setRole] = useState<AdminRole>('super_admin');
  const code = SAMPLE_CODE;
  const [entered, setEntered] = useState('');
  const [error, setError] = useState('');

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ProductMark />
          <span className="text-lg font-bold">{d.common.adminPortal}</span>
          <SampleChip />
        </div>
        <LangToggle />
      </div>
      <Card>
        <h1 className="text-xl font-bold">{d.admin.signinTitle}</h1>
        <p className="mb-4 text-sm text-muted">{d.admin.signinBody}</p>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">{d.admin.role}</span>
          <select
            className="w-full rounded-xl border border-line bg-white px-3 py-2.5"
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            {(Object.keys(ADMIN_USERS) as AdminRole[]).map((r) => (
              <option key={r} value={r}>
                {d.admin.roles[r]} — {pick(ADMIN_USERS[r].name)}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4">
          <Notice tone="gold">{fill(d.admin.mfaSample, { code })}</Notice>
        </div>
        <label className="mt-3 block">
          <span className="mb-1 block text-sm font-medium">{d.admin.mfa}</span>
          <input
            className="tabular w-full rounded-xl border border-line px-3 py-2.5 tracking-[0.4em]"
            dir="ltr"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={entered}
            onChange={(e) => setEntered(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
        </label>
        {error && (
          <p role="alert" className="mt-2 text-sm text-bad">
            {error}
          </p>
        )}
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() =>
            entered === code
              ? dispatch({ type: 'adminSignIn', role })
              : setError(d.admin.mfaInvalid)
          }
        >
          {d.admin.signin}
        </Button>
      </Card>
      <p className="mt-4 text-center text-xs text-muted">
        {productName('en')} · {d.common.sampleTip}
      </p>
    </div>
  );
}
