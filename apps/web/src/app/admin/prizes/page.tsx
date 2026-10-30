'use client';

import { halalasToSar, prizePoolHalalas } from '@quizate/game';
import { Badge, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { useStore } from '@/lib/store';

/** FR-20 to FR-22: shown locked while prizes.enabled is false (architecture rule 5). */
export default function PrizesPage() {
  const { state } = useStore();
  const { d, num } = useT();
  const table = state.config.prizeTableHalalas;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{d.prizes.title}</h1>
        <Badge tone="bad">{d.config.prizesOff}</Badge>
      </div>
      <Notice tone="gold">{d.prizes.locked}</Notice>

      <div className="pointer-events-none grid gap-4 opacity-80 md:grid-cols-2" aria-disabled>
        <Card title={d.prizes.table}>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 text-start font-medium">{d.prizes.rank}</th>
                <th className="py-1 text-end font-medium">{d.prizes.amount}</th>
              </tr>
            </thead>
            <tbody className="tabular divide-y divide-line">
              {table.map((h, i) => (
                <tr key={i}>
                  <td className="py-1.5">{num(i + 1)}</td>
                  <td className="py-1.5 text-end">{halalasToSar(h)}</td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-1.5">{d.prizes.total}</td>
                <td className="py-1.5 text-end">{halalasToSar(prizePoolHalalas(table))}</td>
              </tr>
            </tbody>
          </table>
        </Card>
        <Card title={d.prizes.workflow}>
          <ol className="list-decimal space-y-1.5 ps-5 text-sm">
            {d.prizes.workflowItems.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
        </Card>
      </div>
      <Card title={d.prizes.rules}>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm">
          {d.prizes.rulesItems.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
