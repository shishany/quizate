'use client';

import { useMemo } from 'react';
import { rankStandings, riyadhMonthKey, standingFor, type RankedStanding } from '@quizate/game';
import { SAMPLE_PLAYERS, sampleMonthResults } from './sample';
import { useStore } from './store';
import type { BiText } from '@/data/questions';

export interface BoardRow extends RankedStanding {
  name: BiText;
  cityId: string;
  me: boolean;
  allTime: number;
}

/** This Riyadh month's ranking: sample players and the signed-in player, ordered by BR-10. */
export function useBoard(now = new Date()): {
  month: string;
  rows: BoardRow[];
  me: BoardRow | null;
} {
  const { state } = useStore();
  const month = riyadhMonthKey(now);
  const { config, myResults, player, matches } = state;

  // Regenerated per month (not per render) so the sample ranking stays still while you play.
  const sample = useMemo(() => sampleMonthResults(now, config), [month, config]);

  return useMemo(() => {
    const standings = SAMPLE_PLAYERS.map((p) =>
      standingFor(p.id, sample.get(p.id) ?? [], month, config),
    );
    if (player) {
      const mine = standingFor(player.id, myResults, month, config);
      // BR-15: the prize ranking also needs a Nafath-verified identity and a verified IBAN.
      standings.push({
        ...mine,
        eligible: mine.eligible && Boolean(player.identityVerifiedAt && player.iban),
      });
    }
    const ranked = rankStandings(standings);
    const myAllTime = matches.reduce((s, m) => s + m.monthlyPoints, 0);
    const rows: BoardRow[] = ranked.map((r) => {
      const sp = SAMPLE_PLAYERS.find((p) => p.id === r.playerId);
      return {
        ...r,
        name: sp ? sp.name : { ar: player?.name ?? '', en: player?.name ?? '' },
        cityId: sp ? sp.cityId : (player?.cityId ?? 'riyadh'),
        me: !sp,
        allTime: sp ? sp.allTimeBase + r.points : myAllTime,
      };
    });
    return { month, rows, me: rows.find((r) => r.me) ?? null };
  }, [sample, month, config, myResults, player, matches]);
}
