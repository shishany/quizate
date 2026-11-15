'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seededRng, type FeatureFlags } from '@quizate/game';
import { initialSim, stepSim, type SimState } from './sim';
import { PHASES, flagsFor, type Phase } from './phases';

const KEY = 'sabbaq-showcase-phase';

interface ShowcaseState {
  phase: Phase;
  setPhase: (p: Phase) => void;
  /** Session flags for the chosen phase (showcase pages only). */
  flags: FeatureFlags;
  /** Guided tour: current step index, or null when closed. */
  tourStep: number | null;
  setTourStep: (n: number | null) => void;
  /** Live simulation (demo data), shared by every showcase page. */
  sim: SimState;
}

/** How often the simulation steps. */
export const SIM_TICK_MS = 2500;

const Ctx = createContext<ShowcaseState | null>(null);

/** Phase lives in sessionStorage: this tab only, gone when it closes. Never touches the app's saved state. */
export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [phase, setPhaseState] = useState<Phase>('mvp');
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [rng] = useState(() => seededRng(20261115));
  const [sim, setSim] = useState<SimState>(() => initialSim(seededRng(7), 12));
  useEffect(() => {
    setSim(initialSim(seededRng(7), new Date().getHours()));
    const id = setInterval(() => setSim((s) => stepSim(s, rng)), SIM_TICK_MS);
    return () => clearInterval(id);
  }, [rng]);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(KEY) as Phase | null;
      if (saved && PHASES.includes(saved)) setPhaseState(saved);
    } catch {
      // storage blocked: stay on MVP
    }
  }, []);
  const value = useMemo<ShowcaseState>(
    () => ({
      phase,
      setPhase: (p) => {
        setPhaseState(p);
        try {
          sessionStorage.setItem(KEY, p);
        } catch {
          // ignore
        }
      },
      flags: flagsFor(phase),
      tourStep,
      setTourStep,
      sim,
    }),
    [phase, tourStep, sim],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShowcase(): ShowcaseState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useShowcase outside ShowcaseProvider');
  return v;
}
