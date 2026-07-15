// The app store. Holds engine state, drives the advance loop, autosaves.
// NO game logic here — every rule lives in the engine.
import { create } from 'zustand';
import {
  advanceWeek, createCareer, dispatch, weekSignal, buildRecap,
  type Action, type CareerState, type LifeEventDef, type MatchDecisionDef,
  type Reason, type WeekDecisions, type WeekReport, type Recap,
} from '@engine/index';
import { epithet } from '@engine/index';
import { saveCareer, loadMostRecent, enshrineCareer } from './db';

export type Route =
  | 'title' | 'prospect' | 'ambitions' | 'hub' | 'match' | 'summary'
  | 'seasonEnd' | 'prologueEnd' | 'team' | 'league' | 'player'
  | 'careerEnd' | 'legacy' | 'moment';

const MOMENT_KINDS = new Set(['debut', 'first_goal', 'callup', 'trophy', 'transfer', 'retirement']);

interface PendingLife { event: LifeEventDef; reason: Reason }
interface PendingMatch { decision: MatchDecisionDef; minute: number }

interface AppState {
  career: CareerState | null;
  route: Route;
  report: WeekReport | null;          // the report being presented
  digests: string[];                  // compressed weeks from Continue
  pendingLife: PendingLife | null;
  pendingMatch: PendingMatch | null;
  pendingDecisions: WeekDecisions;    // accumulated answers for the paused week
  recap: Recap | null;                // "previously on your career"
  booted: boolean;
  matchViewed: boolean;

  boot: () => Promise<void>;
  newCareer: (prospectIndex: number, seed?: number) => void;
  endCareerAcknowledged: () => void;
  setRoute: (r: Route) => void;
  act: (a: Action) => void;
  advance: () => void;
  continueToBeat: () => void;
  answerLife: (choiceIndex: number) => void;
  answerMatch: (choiceIndex: number) => void;
  finishMatchView: () => void;
  finishMoment: () => void;
  finishSummary: () => void;
  dismissRecap: () => void;
}

const RECAP_AFTER_MS = 1000 * 60 * 60 * 36; // 36h away -> show the recap

function commit(set: (p: Partial<AppState>) => void, career: CareerState): void {
  void saveCareer(career);
  set({ career });
}

export const useStore = create<AppState>((set, get) => ({
  career: null,
  route: 'title',
  report: null,
  digests: [],
  pendingLife: null,
  pendingMatch: null,
  pendingDecisions: {},
  recap: null,
  booted: false,
  matchViewed: false,

  boot: async () => {
    const row = await loadMostRecent();
    if (row) {
      const awayMs = Date.now() - row.savedAt;
      // forward-migrate older saves: new fields get safe defaults
      const career = row.state;
      career.offers ??= [];
      career.news ??= [];
      career.seasonsAtClub ??= 0;
      career.prospectIndex ??= 0;
      career.loanFromClubId ??= null;
      career.debtWeeks ??= 0;
      career.cup ??= null;
      set({
        career,
        booted: true,
        recap: awayMs > RECAP_AFTER_MS && !career.endedReason ? buildRecap(career) : null,
        route: career.endedReason ? 'careerEnd' : 'hub',
      });
    } else {
      set({ booted: true, route: 'title' });
    }
  },

  newCareer: (prospectIndex, seed) => {
    const id = `career_${seed ?? Math.floor(Math.random() * 1e9)}`;
    const career = createCareer(id, { prospectIndex, seed });
    commit(set, career);
    set({ route: 'ambitions', report: null, digests: [], recap: null });
  },

  setRoute: (route) => set({ route }),

  act: (a) => {
    const { career } = get();
    if (!career) return;
    const next = dispatch(career, a);
    commit(set, next);
    // choosing to retire ends the career here — enshrine it
    if (next.endedReason && !career.endedReason) {
      void enshrineCareer(next, epithet(next));
      set({ route: 'careerEnd' });
    }
  },

  endCareerAcknowledged: () => set({ route: 'legacy' }),

  advance: () => {
    const { career, pendingDecisions } = get();
    if (!career) return;
    const res = advanceWeek(career, pendingDecisions);
    if (res.kind === 'needs-life') {
      set({ pendingLife: { event: res.event, reason: res.reason } });
      return;
    }
    if (res.kind === 'needs-match') {
      set({ pendingMatch: { decision: res.decision, minute: res.minute } });
      return;
    }
    commit(set, res.state);
    routeAfterReport(set, res.state, res.report, []);
    set({ pendingDecisions: {}, pendingLife: null, pendingMatch: null });
  },

  continueToBeat: () => {
    const { career } = get();
    if (!career) return;
    let state = career;
    const digests: string[] = [];
    for (let i = 0; i < 12; i++) {
      const res = advanceWeek(state, {});
      if (res.kind !== 'done') {
        // an interactive moment IS a beat — commit progress so far and surface it
        commit(set, state);
        if (res.kind === 'needs-life') set({ pendingLife: { event: res.event, reason: res.reason }, digests });
        else set({ pendingMatch: { decision: res.decision, minute: res.minute }, digests });
        return;
      }
      state = res.state;
      const signal = weekSignal(state, res.report);
      if (signal.worthStopping || i === 11) {
        commit(set, state);
        routeAfterReport(set, state, res.report, digests);
        return;
      }
      digests.push(res.report.digest);
    }
  },

  answerLife: (choiceIndex) => {
    const decisions = { ...get().pendingDecisions, life: choiceIndex };
    set({ pendingDecisions: decisions, pendingLife: null });
    get().advance();
  },

  answerMatch: (choiceIndex) => {
    const decisions = { ...get().pendingDecisions, match: choiceIndex };
    set({ pendingDecisions: decisions, pendingMatch: null });
    get().advance();
  },

  finishMatchView: () => {
    const { report } = get();
    const big = report?.milestones.find((m) => MOMENT_KINDS.has(m.kind));
    set({ matchViewed: true, route: big ? 'moment' : 'summary' });
  },

  finishMoment: () => set({ route: 'summary' }),

  finishSummary: () => {
    const { report } = get();
    if (report?.prologueComplete) set({ route: 'prologueEnd' });
    else if (report?.seasonComplete) set({ route: 'seasonEnd' });
    else set({ route: 'hub', report: null, digests: [] });
  },

  dismissRecap: () => set({ recap: null }),
}));

function routeAfterReport(
  set: (p: Partial<AppState>) => void,
  state: CareerState,
  report: WeekReport,
  digests: string[],
): void {
  if (state.endedReason) {
    void enshrineCareer(state, epithet(state));
    set({ report, digests, route: 'careerEnd' });
    return;
  }
  const played = report.match && (report.match.minutes > 0 || report.match.involvement === 'bench');
  const big = !played && report.milestones.find((m) => MOMENT_KINDS.has(m.kind));
  set({ report, digests, matchViewed: false, route: played ? 'match' : big ? 'moment' : 'summary' });
}
