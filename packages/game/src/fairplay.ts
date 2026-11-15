import type { GameConfig } from './config.js';
import type { AnswerRecord } from './scoring.js';

/** BRD section 3: answers faster than a human could read the question, more than the allowed number of times. */
export function inhumanSpeedFlag(answers: readonly AnswerRecord[], cfg: GameConfig): boolean {
  const fast = answers.filter(
    (a) => a.latencyMs !== null && a.latencyMs < cfg.fairPlay.minHumanMs,
  ).length;
  return fast > cfg.fairPlay.maxFastAnswers;
}

export interface PairMatch {
  at: string;
  playerA: string;
  playerB: string;
  /** Winner id, or null for a draw. */
  winner: string | null;
}

export interface CollusionAlert {
  pair: [string, string];
  matches: number;
  /** The player who won the one-sided share. */
  dominant: string;
  from: string;
  to: string;
}

/**
 * The same two players with >= N matches inside a sliding window (default 3 in 7 days) and a one-sided result
 * pattern (default: the same winner every time; a draw breaks it). One alert per pair, for the busiest window.
 */
export function collusionAlerts(matches: readonly PairMatch[], cfg: GameConfig): CollusionAlert[] {
  const { minMatches, windowHours, oneSidedShare } = cfg.collusion;
  const byPair = new Map<string, PairMatch[]>();
  for (const m of matches) {
    const pair = [m.playerA, m.playerB].sort() as [string, string];
    const key = pair.join('|');
    byPair.set(key, [...(byPair.get(key) ?? []), m]);
  }
  const out: CollusionAlert[] = [];
  for (const [key, list] of byPair) {
    const sorted = [...list].sort((a, b) => a.at.localeCompare(b.at));
    let best: CollusionAlert | null = null;
    for (let i = 0; i < sorted.length; i++) {
      const start = new Date(sorted[i]!.at).getTime();
      const inWindow = sorted.filter(
        (m) => new Date(m.at).getTime() >= start && new Date(m.at).getTime() < start + windowHours * 3_600_000,
      );
      if (inWindow.length < minMatches) continue;
      const wins = new Map<string, number>();
      for (const m of inWindow) if (m.winner) wins.set(m.winner, (wins.get(m.winner) ?? 0) + 1);
      const [dominant, n] = [...wins.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
      if (n / inWindow.length >= oneSidedShare && (!best || inWindow.length > best.matches)) {
        best = {
          pair: key.split('|') as [string, string],
          matches: inWindow.length,
          dominant,
          from: inWindow[0]!.at,
          to: inWindow[inWindow.length - 1]!.at,
        };
      }
    }
    if (best) out.push(best);
  }
  return out;
}
