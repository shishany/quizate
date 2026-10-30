'use client';

import { useRouter } from 'next/navigation';
import { Badge, Button, Card, LangToggle, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { ageOn } from '@/lib/moderation';
import { cityById } from '@/lib/sample';
import { useStore } from '@/lib/store';

/** Account, consents (FR-02), data export and deletion (FR-03). */
export default function ProfilePage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, date } = useT();
  const router = useRouter();
  const p = state.player;
  if (!p) return null;
  const adult = ageOn(p.birthDate, new Date()) >= 18;

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      player: p,
      matches: state.matches,
      rankedResults: state.myResults,
      following: state.following,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function remove() {
    if (window.confirm(d.profile.deleteConfirm)) {
      dispatch({ type: 'reset' });
      router.push('/');
    }
  }

  function reset() {
    if (window.confirm(d.common.resetConfirm)) {
      dispatch({ type: 'reset' });
      router.push('/');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.profile.title}</h1>
      <Card>
        <div className="flex items-center gap-4">
          <span
            className="grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-xl font-bold text-brand-deep ring-2 ring-sky"
            aria-hidden
          >
            {p.name.slice(0, 1)}
          </span>
          <div>
            <div className="text-lg font-bold">{p.name}</div>
            <div className="text-sm text-muted" dir="ltr">
              {p.phoneMasked}
            </div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">{d.profile.rating}</dt>
            <dd className="tabular font-semibold">{num(p.rating)}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.profile.city}</dt>
            <dd className="font-semibold">{pick(cityById(p.cityId).name)}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.profile.memberSince}</dt>
            <dd className="font-semibold">{date(p.createdAt)}</dd>
          </div>
        </dl>
        <div className="mt-3">
          <Badge tone={adult ? 'ok' : 'warn'}>
            {adult ? d.profile.prizeEligible : d.profile.prizeIneligible}
          </Badge>
        </div>
      </Card>

      <Card title={d.profile.consents}>
        <ul className="space-y-2 text-sm">
          {p.consents.map((c) => (
            <li key={c.type} className="flex items-center justify-between gap-3">
              <span>{d.profile[`consent_${c.type}`]}</span>
              <span className="text-xs text-muted">
                {fill(d.profile.version, { v: c.version })} · {date(c.grantedAt)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3">
          <Notice>{d.profile.privacyNote}</Notice>
        </div>
      </Card>

      <Card title={d.profile.language}>
        <LangToggle />
      </Card>

      <Card title={d.profile.data}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={exportData}>
            {d.profile.export}
          </Button>
          <Button variant="danger" onClick={remove}>
            {d.profile.delete}
          </Button>
        </div>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => dispatch({ type: 'signOut' })}>
          {d.common.signOut}
        </Button>
        <Button variant="ghost" onClick={reset}>
          {d.common.reset}
        </Button>
      </div>
    </div>
  );
}
