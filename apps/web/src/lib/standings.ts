'use client';

import { useMemo } from 'react';
import {
  boardBadges,
  cashEligible,
  rankStandings,
  riyadhMonthKey,
  standingFor,
  type RankedStanding,
} from '@quizate/game';
import { SAMPLE_PLAYERS, sampleMonthResults } from './sample';
import { useStore } from './store';
import type { BiText } from '@/data/questions';

export interface BoardRow extends RankedStanding {
  name: BiText;
  cityId: string;
  me: boolean;
  allTime: number;
  ageGroup: 'youth' | 'adult';
  cashEligible: boolean;
  birthDate: string;
  /** CR v3 section 6: 1-10 among qualified cash-eligible players. */
  prizeZone: number | null;
  /** CR v3 section 6: top qualified youth players (youth award). */
  youthTop: number | null;
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
      standings.push(mine);
    }
    const ranked = rankStandings(standings);
    const myAllTime = matches.reduce((s, m) => s + m.monthlyPoints, 0);
    const base = ranked.map((r) => {
      const sp = SAMPLE_PLAYERS.find((p) => p.id === r.playerId);
      return {
        r,
        sp,
        ageGroup: sp ? sp.ageGroup : (player?.ageGroup ?? 'adult'),
        birthDate: sp ? sp.birthDate : (player?.birthDate ?? '2000-01-01'),
        // CR v3 section 3: cash_eligible = age >= 18 AND id_verified (an admin sets id_verified at payout).
        cashEligible: sp
          ? sp.cashEligible
          : Boolean(player && cashEligible(player.birthDate, player.idVerified === true, now)),
      };
    });
    const badges = boardBadges(
      base.map((b) => ({
        playerId: b.r.playerId,
        eligible: b.r.eligible,
        cashEligible: b.cashEligible,
        ageGroup: b.ageGroup,
        qualifyingMatches: b.r.qualifyingMatches,
      })),
      config.prizeTableHalalas.length,
      config.youthAwardSlots,
      config.eligibility.youthMinMatches,
    );
    const rows: BoardRow[] = base.map(({ r, sp, ageGroup, birthDate, cashEligible: cash }) => {
      return {
        ...r,
        ageGroup,
        birthDate,
        cashEligible: cash,
        prizeZone: badges.get(r.playerId)?.prizeZone ?? null,
        youthTop: badges.get(r.playerId)?.youthTop ?? null,
        name: sp ? sp.name : { ar: player?.name ?? '', en: player?.name ?? '' },
        cityId: sp ? sp.cityId : (player?.cityId ?? 'riyadh'),
        me: !sp,
        allTime: sp ? sp.allTimeBase + r.points : myAllTime,
      };
    });
    return { month, rows, me: rows.find((r) => r.me) ?? null };
  }, [sample, month, config, myResults, player, matches]);
}
