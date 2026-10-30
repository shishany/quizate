'use client';

import { useState } from 'react';
import { Button, Card, LangToggle, Notice, ProductMark, SampleChip } from '@/components/ui';
import { useT } from '@/i18n';
import { ADMIN_USERS } from '@/lib/sample';
import { useStore } from '@/lib/store';
import type { AdminRole } from '@/lib/types';

/**
 * The sample version opens the admin console in one click (owner request, 2026-10-30). Production requires a password
 * and a mandatory second factor for every admin user (FR-25).
 */
export function AdminSignIn() {
  const { dispatch } = useStore();
  const { d, pick } = useT();
  const [role, setRole] = useState<AdminRole>('content_editor');

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ProductMark />
          <span className="text-lg font-bold">{d.common.adminPortal}</span>
          <SampleChip />
        </div>
        <LangToggle />
      </div>
      <Card>
        <h1 className="text-xl font-bold">{d.admin.signinTitle}</h1>
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() => dispatch({ type: 'adminSignIn', role: 'super_admin' })}
        >
          {d.admin.enter}
        </Button>
        <div className="mt-3">
          <Notice>{d.admin.productionNote}</Notice>
        </div>

        <div className="mt-6 border-t border-line pt-4">
          <p className="mb-2 text-sm font-medium">{d.admin.otherRole}</p>
          <div className="flex gap-2">
            <select
              className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
              aria-label={d.admin.role}
            >
              {(Object.keys(ADMIN_USERS) as AdminRole[]).map((r) => (
                <option key={r} value={r}>
                  {d.admin.roles[r]} — {pick(ADMIN_USERS[r].name)}
                </option>
              ))}
            </select>
            <Button variant="secondary" onClick={() => dispatch({ type: 'adminSignIn', role })}>
              {d.admin.signin}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
