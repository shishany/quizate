'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Avatar, Coin, useEngagement } from '@/components/player/engagement';
import { Badge, Button, Card, LangToggle, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { badgesFor, type CosmeticId } from '@/lib/engagement';
import { IbanVerify, NafathVerify } from '@/components/player/Verify';
import { cityById } from '@/lib/sample';
import { useStore } from '@/lib/store';

const BADGES = [
  'firstWin',
  'ranked10',
  'perfect',
  'streak7',
  'mirrorFirst',
  'level5',
  'speed15',
] as const;

/** Account: identity (FR-01), IBAN (FR-04), consents (FR-02), progression (FR-30), data export and deletion (FR-03). */
export default function ProfilePage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, date } = useT();
  const router = useRouter();
  const e = useEngagement();
  /** Kept only in memory, to fill the sample IBAN; never stored. */
  const [nid, setNid] = useState<string | null>(null);
  const p = state.player;
  if (!p) return null;
  const earned = badgesFor(state);
  const title = state.equipped.title as CosmeticId | null;

  function exportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      player: p,
      matches: state.matches,
      rankedResults: state.myResults,
      xp: state.xp,
      coins: state.coins,
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

  function wipe(message: string) {
    if (window.confirm(message)) {
      dispatch({ type: 'reset' });
      router.push('/');
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{d.profile.title}</h1>
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={p.name} frame={state.equipped.frame} size="lg" />
          <div className="min-w-0">
            <div className="text-lg font-bold">{p.name}</div>
            {title && <div className="text-sm font-semibold text-violet">{d.cosmetics[title]}</div>}
            <div className="text-sm text-muted" dir="ltr">
              {p.phoneMasked}
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-page p-2">
            <div className="text-xs text-muted">{d.profile.level}</div>
            <div className="tabular font-bold">{num(e.level.level)}</div>
          </div>
          <div className="rounded-xl bg-page p-2">
            <div className="text-xs text-muted">{d.profile.rating}</div>
            <div className="tabular font-bold">{num(p.rating)}</div>
          </div>
          <div className="rounded-xl bg-page p-2">
            <div className="text-xs text-muted">{d.profile.coins}</div>
            <Coin n={num(e.coins)} className="justify-center font-bold" />
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted">{d.profile.city}</dt>
            <dd className="font-semibold">{pick(cityById(p.cityId).name)}</dd>
          </div>
          <div>
            <dt className="text-muted">{d.profile.memberSince}</dt>
            <dd className="font-semibold">{date(p.createdAt)}</dd>
          </div>
        </dl>
      </Card>

      <Card title={d.profile.identity}>
        <div id="verify" className="flex flex-wrap gap-2">
          {p.identityVerifiedAt ? (
            <Badge tone="ok">{d.profile.nafath}</Badge>
          ) : (
            <Badge tone="warn">{d.profile.notVerified}</Badge>
          )}
          {p.iban ? (
            <Badge tone="ok">{d.profile.ibanVerified}</Badge>
          ) : (
            <Badge tone="warn">{d.profile.ibanNone}</Badge>
          )}
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">{d.profile.nationalId}</dt>
            <dd className="tabular font-semibold" dir="ltr">
              {p.nationalIdMasked ?? '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">{d.profile.dob}</dt>
            <dd className="font-semibold">
              {date(`${p.birthDate}T12:00:00Z`)}{' '}
              <span className="text-xs font-normal text-muted">
                ({p.dobSource === 'nafath' ? d.profile.dobVerified : d.profile.dobDeclared})
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted">{d.profile.iban}</dt>
            <dd className="tabular font-semibold" dir="ltr">
              {p.iban ? p.iban.masked : '—'}
            </dd>
          </div>
        </dl>
        {!p.identityVerifiedAt && (
          <div className="mt-4 rounded-xl border border-line p-3">
            <p className="mb-3 text-sm font-medium">{d.profile.verifyWhy}</p>
            <NafathVerify
              onVerified={(v) => {
                setNid(v.nationalId);
                dispatch({
                  type: 'verifyIdentity',
                  nationalIdMasked: v.nationalIdMasked,
                  birthDate: v.birthDate,
                });
              }}
            />
          </div>
        )}
        {p.identityVerifiedAt && !p.iban && (
          <div className="mt-4 rounded-xl border border-line p-3">
            <IbanVerify
              nationalId={nid}
              nationalIdMasked={p.nationalIdMasked ?? ''}
              onVerified={(masked) => dispatch({ type: 'setIban', masked })}
            />
          </div>
        )}
        <p className="mt-3 text-xs text-muted">{d.profile.identityNote}</p>
      </Card>

      <Card title={d.profile.badges}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BADGES.map((b) => {
            const has = earned.includes(b);
            return (
              <li
                key={b}
                className={`rounded-xl p-3 text-center text-xs font-semibold ${has ? 'bg-gold/15 text-gold-ink' : 'bg-page text-muted opacity-60'}`}
              >
                <span className="mb-1 block text-xl" aria-hidden>
                  {has ? '★' : '☆'}
                </span>
                {d.badges[b]}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title={d.profile.cosmetics}>
        {state.cosmetics.length === 0 ? (
          <p className="text-sm text-muted">{d.profile.noCosmetics}</p>
        ) : (
          <ul className="space-y-2">
            {(state.cosmetics as CosmeticId[]).map((c) => {
              const slot = c.startsWith('frame') ? 'frame' : 'title';
              const on = state.equipped[slot] === c;
              return (
                <li key={c} className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{d.cosmetics[c]}</span>
                  <Button
                    size="sm"
                    variant={on ? 'secondary' : 'primary'}
                    onClick={() => dispatch({ type: 'equip', slot, id: on ? null : c })}
                  >
                    {on ? d.profile.unequip : d.profile.equip}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
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
          <Button variant="danger" onClick={() => wipe(d.profile.deleteConfirm)}>
            {d.profile.delete}
          </Button>
        </div>
      </Card>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => dispatch({ type: 'signOut' })}>
          {d.common.signOut}
        </Button>
        <Button variant="ghost" onClick={() => wipe(d.common.resetConfirm)}>
          {d.common.reset}
        </Button>
      </div>
    </div>
  );
}
