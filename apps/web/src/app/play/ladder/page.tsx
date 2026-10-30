'use client';

import { useEffect, useRef } from 'react';
import { monthFreezeAt, riyadhMonthKey } from '@quizate/game';
import { Coin, useEngagement } from '@/components/player/engagement';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { ENG, ROAD, ROMAN, reached, type RoadNode } from '@/lib/engagement';
import { useBoard } from '@/lib/standings';
import { useStore } from '@/lib/store';

/**
 * The monthly ladder as a road (FR-30, ENGAGEMENT.md section 3): tiers and divisions from BR-04 monthly points, with
 * the reward at each stop. It reads monthly points and never changes them (architecture rule 10).
 */
export default function LadderPage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick } = useT();
  const { me } = useBoard();
  const e = useEngagement();
  const points = me?.points ?? 0;
  const rank = me && me.counted > 0 ? me.rank : null;
  const month = riyadhMonthKey(new Date());
  const currentRef = useRef<HTMLLIElement>(null);
  const tier = ENG.ladder.tiers[e.ladder.tierIndex];
  const freeze = monthFreezeAt(new Date());
  const ms = Math.max(0, freeze.getTime() - Date.now());

  const nodes = [...ROAD].reverse();
  const currentId = [...ROAD].reverse().find((n) => reached(n, points, rank))?.id;

  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="-mx-4 -mt-5">
      <div className="bg-[linear-gradient(180deg,#1a1240_0%,#3a1660_45%,#0b2238_100%)] px-4 pb-8 pt-6 text-white">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-wide text-gold">{d.ladder.title}</p>
          <div className="mx-auto mt-3 grid h-20 w-20 place-items-center rounded-2xl bg-[linear-gradient(135deg,#d4a64c,#f3d58a)] text-3xl font-black text-[#3a1660] shadow-lg [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)]">
            {e.ladder.tierIndex + 1}
          </div>
          <h1 className="mt-2 text-2xl font-black">
            {tier ? pick(tier.name) : ''} {e.ladder.division ? ROMAN[e.ladder.division] : ''}
          </h1>
          <p className="tabular mt-1 text-sm text-white/80">
            {fill(d.ladder.points, { n: num(points, 1) })}
          </p>
          {e.ladder.nextAt !== null && (
            <p className="text-xs text-white/70">
              {fill(d.ladder.next, { n: num(Math.max(0, e.ladder.nextAt - points), 1) })}
            </p>
          )}
        </div>

        <ol className="relative mt-8 space-y-4">
          <span
            className="absolute inset-y-0 start-[27px] w-1.5 rounded-full bg-white/15"
            aria-hidden
          />
          {nodes.map((n) => {
            const isReached = reached(n, points, rank);
            const claimed = state.roadClaims.includes(`${month}:${n.id}`);
            const isCurrent = n.id === currentId;
            return (
              <li
                key={n.id}
                ref={isCurrent ? currentRef : undefined}
                className="relative flex items-center gap-3"
              >
                <span
                  className={`absolute start-[27px] w-1.5 ${isReached ? 'bg-gold' : ''}`}
                  style={{ top: '50%', bottom: '-1rem' }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center text-lg font-black [clip-path:polygon(25%_0,75%_0,100%_50%,75%_100%,25%_100%,0_50%)] ${isReached ? 'bg-[linear-gradient(135deg,#d4a64c,#f3d58a)] text-[#3a1660]' : 'bg-white/15 text-white/70'}`}
                >
                  {n.tierIndex + 1}
                </span>
                <Stop
                  node={n}
                  reached={isReached}
                  claimed={claimed}
                  current={isCurrent}
                  onClaim={() => dispatch({ type: 'claimRoad', nodeId: n.id })}
                />
              </li>
            );
          })}
        </ol>
      </div>

      <div className="space-y-2 px-4 py-4 text-xs text-muted">
        <p className="tabular font-semibold text-ink">
          {d.ladder.endsIn} {num(Math.floor(ms / 86_400_000))}
          {d.ladder.d} {num(Math.floor((ms % 86_400_000) / 3_600_000))}
          {d.ladder.h}
        </p>
        <p>{d.ladder.note}</p>
        <p>{d.ladder.resetNote}</p>
        <p>{d.ladder.partnerLocked}</p>
      </div>
    </div>
  );
}

function Stop({
  node,
  reached: isReached,
  claimed,
  current,
  onClaim,
}: {
  node: RoadNode;
  reached: boolean;
  claimed: boolean;
  current: boolean;
  onClaim: () => void;
}) {
  const { d, fill, num, pick } = useT();
  const tier = ENG.ladder.tiers[node.tierIndex];
  const r = node.reward;
  const claimable = Boolean(r && (r.coins || r.cosmetic));
  return (
    <div
      className={`flex-1 rounded-2xl border-2 p-3 ${current ? 'border-gold bg-white/15' : 'border-white/10 bg-white/5'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">
          {tier ? pick(tier.name) : ''} {node.division ? ROMAN[node.division] : ''}
        </span>
        <span className="tabular rounded-full bg-black/30 px-2 py-0.5 text-xs">
          {node.at === null
            ? fill(d.ladder.eliteRule, { n: num(ENG.ladder.eliteTopRank) })
            : `${num(node.at)} ${d.common.pts}`}
        </span>
      </div>
      {r && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {r.coins && (
            <span className="rounded-lg bg-black/25 px-2 py-1 text-xs">
              <Coin n={num(r.coins)} />
            </span>
          )}
          {r.cosmetic && (
            <span className="rounded-lg bg-violet/40 px-2 py-1 text-xs font-semibold">
              {d.cosmetics[r.cosmetic]}
            </span>
          )}
          {r.partner && (
            <span className="rounded-lg border border-dashed border-gold/60 px-2 py-1 text-xs font-semibold text-gold">
              🔒 {r.partner === 'voucher' ? d.ladder.partnerVoucher : d.ladder.partnerProduct}
            </span>
          )}
          <span className="ms-auto">
            {claimed ? (
              <span className="text-xs font-semibold text-gold">✓ {d.ladder.claimed}</span>
            ) : isReached && claimable ? (
              <Button size="sm" className="!bg-none bg-gold text-[#3a1660]" onClick={onClaim}>
                {d.ladder.claim}
              </Button>
            ) : !isReached ? (
              <span className="text-xs text-white/50">{d.ladder.locked}</span>
            ) : null}
          </span>
        </div>
      )}
      {current && <p className="mt-2 text-xs font-semibold text-gold">{d.ladder.youAreHere}</p>}
    </div>
  );
}
