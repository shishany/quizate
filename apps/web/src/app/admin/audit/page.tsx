'use client';

import { Card } from '@/components/ui';
import { useT } from '@/i18n';
import { adminName } from '@/lib/sample';
import { useStore } from '@/lib/store';

/** FR-25: every admin action, with actor, item, reason and the change. */
export default function AuditPage() {
  const { state } = useStore();
  const { d, date, locale } = useT();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.audit.title}</h1>
      <Card className="overflow-x-auto p-0 sm:p-0">
        {state.audit.length === 0 ? (
          <p className="p-4 text-sm text-muted">{d.audit.empty}</p>
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-page text-xs text-muted">
              <tr>
                {[
                  d.audit.when,
                  d.audit.actor,
                  d.audit.action,
                  d.audit.entity,
                  d.audit.change,
                  d.audit.reason,
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-start font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td className="tabular px-3 py-2 text-xs">{date(a.at, true)}</td>
                  <td className="px-3 py-2">{adminName(a.actor, locale)}</td>
                  <td className="px-3 py-2">
                    <code dir="ltr" className="text-xs">
                      {a.action}
                    </code>
                  </td>
                  <td className="px-3 py-2">
                    <code dir="ltr" className="text-xs">
                      {a.entity}
                    </code>
                  </td>
                  <td className="px-3 py-2 text-xs" dir="ltr">
                    {a.before !== undefined ? `${a.before} → ${a.after}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">{a.reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
