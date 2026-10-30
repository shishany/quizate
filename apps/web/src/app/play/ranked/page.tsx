'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  findOpponent,
  pairAllowed,
  rankedAllowed,
  roundCoord,
  searchStep,
  seededRng,
  selectQuestions,
  shuffle,
  type AnswerRecord,
  type DistanceBand,
  type QueueEntry,
} from '@quizate/game';
import { MatchPlayer, type MatchOutcome } from '@/components/player/MatchPlayer';
import { ResultView } from '@/components/player/ResultView';
import { Badge, Button, Card, Notice } from '@/components/ui';
import { useT } from '@/i18n';
import { live } from '@/lib/live';
import { SAMPLE_PLAYERS, cityById } from '@/lib/sample';
import { settle } from '@/lib/settle';
import { useStore } from '@/lib/store';
import type { MatchSummary, Question, SamplePlayer } from '@/lib/types';

type Phase =
  | { kind: 'setup' }
  | { kind: 'search'; startedAt: number; location: QueueEntry['location'] }
  | { kind: 'found'; opponent: SamplePlayer; band: DistanceBand; foundAt: number }
  | {
      kind: 'match';
      id: string;
      seed: number;
      opponent: SamplePlayer;
      band: DistanceBand;
      questions: Question[];
    }
  | { kind: 'result'; summary: MatchSummary; questions: Question[]; mine: AnswerRecord[] };

/** FR-05 matchmaking (BRD section 4) and a ranked match (FR-06 to FR-08). */
export default function RankedPage() {
  const { state, dispatch } = useStore();
  const { d, fill, num, pick, date } = useT();
  const router = useRouter();
  const cfg = state.config;
  const player = state.player;
  const [phase, setPhase] = useState<Phase>({ kind: 'setup' });
  const [useLocation, setUseLocation] = useState(false);
  const [locationMsg, setLocationMsg] = useState('');
  const [problem, setProblem] = useState('');
  const [tick, setTick] = useState(0);
  const arrivals = useRef<{ p: SamplePlayer; at: number }[]>([]);
  const hasLocationConsent = Boolean(player?.consents.some((c) => c.type === 'location'));

  const history = useMemo(
    () => state.myResults.map((r) => ({ at: r.at, opponentId: r.opponentId })),
    [state.myResults],
  );
  const allowed = rankedAllowed(history, state.abandons, new Date(), cfg);

  useEffect(() => {
    if (phase.kind !== 'search' && phase.kind !== 'found') return;
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [phase.kind]);

  // Matcher: each tick, try the rule for the current wait against players who have joined the queue so far.
  useEffect(() => {
    if (phase.kind !== 'search' || !player) return;
    const waited = (Date.now() - phase.startedAt) / 1000;
    const pool = arrivals.current
      .filter((a) => a.at <= waited)
      .map((a) => ({ id: a.p.id, rating: a.p.rating, cityId: a.p.cityId, location: a.p.location }));
    const me: QueueEntry = {
      id: player.id,
      rating: player.rating,
      cityId: player.cityId,
      location: phase.location,
    };
    const hit = findOpponent(me, pool, waited, cfg);
    if (hit) {
      const opponent = SAMPLE_PLAYERS.find((p) => p.id === hit.opponent.id) as SamplePlayer;
      setPhase({ kind: 'found', opponent, band: hit.band, foundAt: Date.now() });
    }
  }, [tick, phase, player, cfg]);

  // Accept window (build prompt 5): requeue if not accepted in time.
  useEffect(() => {
    if (phase.kind === 'found' && Date.now() - phase.foundAt > cfg.acceptSeconds * 1000)
      startSearch();
  });

  if (!player) return null;

  function startSearch(
    location: QueueEntry['location'] = phase.kind === 'search' ? phase.location : null,
  ) {
    const now = new Date();
    const rng = seededRng(Date.now() % 1_000_000);
    const eligible = SAMPLE_PLAYERS.filter((p) => pairAllowed(history, p.id, now, cfg));
    arrivals.current = shuffle(eligible, rng)
      .slice(0, 16)
      .map((p) => ({ p, at: 1 + rng() * 24 }));
    setProblem('');
    setPhase({ kind: 'search', startedAt: Date.now(), location });
  }

  function begin() {
    if (!useLocation || !navigator.geolocation) return startSearch(null);
    setLocationMsg('');
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        startSearch({
          lat: roundCoord(pos.coords.latitude),
          lng: roundCoord(pos.coords.longitude),
        }),
      () => {
        setLocationMsg(d.mm.locationDenied);
        startSearch(null);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600_000 },
    );
  }

  function accept() {
    if (phase.kind !== 'found' || !player) return;
    const seed = Date.now() % 2_147_483_647;
    const picked = selectQuestions(
      state.questions,
      new Map(Object.entries(state.seen)),
      new Date(),
      cfg,
      seededRng(seed),
    );
    if (!picked.ok) {
      setProblem(fill(d.mm.noQuestions, { d: num(cfg.questionRepeatDays) }));
      return setPhase({ kind: 'setup' });
    }
    const id = `m-${Date.now()}`;
    live.matchId = id;
    const o = phase.opponent;
    dispatch({
      type: 'rankedStart',
      active: {
        id,
        at: new Date().toISOString(),
        opponent: { id: o.id, name: o.name, cityId: o.cityId, band: phase.band, rating: o.rating },
        ratingBefore: player.rating,
      },
    });
    // The rounded location is dropped here: the match keeps the city and the band only (architecture rule 7).
    setPhase({
      kind: 'match',
      id,
      seed,
      opponent: o,
      band: phase.band,
      questions: picked.questions,
    });
  }

  function done(outcome: MatchOutcome) {
    if (phase.kind !== 'match') return;
    const o = phase.opponent;
    const action = settle(state, {
      id: phase.id,
      mode: 'ranked',
      at: state.activeRanked?.at ?? new Date().toISOString(),
      questions: phase.questions,
      mine: outcome.mine,
      theirs: outcome.theirs,
      forfeit: outcome.forfeit,
      opponent: { id: o.id, name: o.name, cityId: o.cityId, band: phase.band, rating: o.rating },
    });
    dispatch(action);
    live.matchId = null;
    setPhase({
      kind: 'result',
      summary: action.summary,
      questions: phase.questions,
      mine: outcome.mine,
    });
  }

  if (phase.kind === 'match') {
    return (
      <MatchPlayer
        seed={phase.seed}
        mode="ranked"
        questions={phase.questions}
        opponent={{
          id: phase.opponent.id,
          name: phase.opponent.name,
          rating: phase.opponent.rating,
          cityId: phase.opponent.cityId,
          bandLabel: d.mm[`band_${phase.band}`],
        }}
        onDone={done}
      />
    );
  }

  if (phase.kind === 'result') {
    const oppId = phase.summary.opponent?.id;
    return (
      <ResultView
        summary={phase.summary}
        questions={phase.questions}
        mine={phase.mine}
        onAgain={() => setPhase({ kind: 'setup' })}
        onRematch={oppId ? () => router.push(`/play/practice?opp=${oppId}`) : undefined}
      />
    );
  }

  const waited = phase.kind === 'search' ? Math.floor((Date.now() - phase.startedAt) / 1000) : 0;
  const { index: stepIndex, step } = searchStep(waited, cfg);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{d.mm.title}</h1>
        <Button variant="ghost" size="sm" onClick={() => router.push('/play')}>
          {d.common.back}
        </Button>
      </div>

      {!allowed.ok && phase.kind === 'setup' && (
        <Notice tone="warn">
          {allowed.reason === 'DAILY_LIMIT'
            ? d.home.dailyLimit
            : fill(d.home.abandonBlock, { time: date(allowed.resetsAt, true) })}
        </Notice>
      )}
      {problem && <Notice tone="warn">{problem}</Notice>}

      {phase.kind === 'setup' && allowed.ok && (
        <Card>
          {hasLocationConsent ? (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-brand"
                checked={useLocation}
                onChange={(e) => setUseLocation(e.target.checked)}
              />
              <span>
                <span className="block font-medium">{d.mm.useLocation}</span>
                <span className="block text-sm text-muted">{d.mm.locationNote}</span>
              </span>
            </label>
          ) : (
            <p className="text-sm text-muted">
              {fill(d.mm.locationOff, { s: num(cfg.matchmaking[2]?.fromSeconds ?? 20) })}
            </p>
          )}
          <Button className="mt-4 w-full" size="lg" onClick={begin}>
            {d.home.play}
          </Button>
          <p className="mt-3 text-xs text-muted">{d.mm.sampleNote}</p>
        </Card>
      )}

      {phase.kind === 'search' && (
        <Card>
          <div className="flex flex-col items-center py-6">
            <span className="relative grid h-20 w-20 place-items-center">
              <span className="pulse-ring absolute inset-0 rounded-full bg-brand/30" aria-hidden />
              <span
                className="bg-brand-gradient relative grid h-16 w-16 place-items-center rounded-full text-2xl text-white"
                aria-hidden
              >
                ⌕
              </span>
            </span>
            <p className="mt-4 font-semibold" aria-live="polite">
              {d.mm.searching}
            </p>
            <p className="tabular text-sm text-muted">{fill(d.mm.waited, { s: num(waited) })}</p>
          </div>
          <ol className="space-y-1.5">
            {cfg.matchmaking.map((s, i) => {
              const label = s.offerPractice
                ? d.mm.stepPractice
                : s.maxKm !== null
                  ? fill(d.mm.stepRadius, { km: num(s.maxKm), band: num(s.ratingBand ?? 0) })
                  : s.sameCity
                    ? d.mm.stepCity
                    : d.mm.stepNation;
              const state_ = i < stepIndex ? 'past' : i === stepIndex ? 'now' : 'next';
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${state_ === 'now' ? 'bg-brand/10 font-semibold text-brand-deep' : state_ === 'past' ? 'text-muted line-through' : 'text-muted'}`}
                >
                  <span>{label}</span>
                  <span className="tabular text-xs">
                    {num(s.fromSeconds)}+ {d.common.sec}
                  </span>
                </li>
              );
            })}
          </ol>
          {locationMsg && <p className="mt-3 text-sm text-warn">{locationMsg}</p>}
          <div className="mt-4 grid gap-2">
            {step.offerPractice && (
              <Button variant="secondary" onClick={() => router.push('/play/practice')}>
                {d.mm.practiceOffer}
              </Button>
            )}
            <Button variant="ghost" onClick={() => setPhase({ kind: 'setup' })}>
              {d.mm.cancel}
            </Button>
          </div>
        </Card>
      )}

      {phase.kind === 'found' && (
        <Card>
          <p className="mb-3 text-center font-semibold text-ok">{d.mm.found}</p>
          <div className="flex items-center gap-4 rounded-xl bg-page p-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold/20 text-xl font-bold text-gold-ink"
              aria-hidden
            >
              {pick(phase.opponent.name).slice(0, 1)}
            </span>
            <div className="min-w-0">
              <div className="text-lg font-bold">{pick(phase.opponent.name)}</div>
              <div className="text-sm text-muted">{pick(cityById(phase.opponent.cityId).name)}</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <Badge tone="brand">{d.mm[`band_${phase.band}`]}</Badge>
                <Badge>
                  {d.mm.rating} {num(phase.opponent.rating)}
                </Badge>
              </div>
            </div>
          </div>
          <p className="tabular mt-3 text-center text-sm text-muted">
            {fill(d.mm.acceptWithin, {
              s: num(
                Math.max(0, Math.ceil(cfg.acceptSeconds - (Date.now() - phase.foundAt) / 1000)),
              ),
            })}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button size="lg" onClick={accept}>
              {d.mm.accept}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setPhase({ kind: 'setup' })}>
              {d.mm.decline}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
