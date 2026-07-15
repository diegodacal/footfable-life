// Career creation + the dispatch surface (plain actions between weeks).
import type { Action, CareerState, Game, MeterMove, TallyId } from '../types/core';
import { hashString, clamp } from '../rng';
import { generateWorld, generateProspects, makeYou, buildPrologueCalendar } from '../worldgen';
import { TRAINING } from '../data/trainingConfig';
import { EVENT_BY_ID } from '../data/events';
import { applyEventChoice } from './life';
import { setAmbitions } from './ambitions';
import { acceptOffer, rejectOffer, requestTransfer } from './transfers';
import { reason, up, down } from './reason';

export interface CreateCareerOpts {
  seed?: number;
  prospectIndex?: number;   // 0–2
  ambitionIds?: string[];
}

export function createCareer(id: string, opts: CreateCareerOpts = {}): CareerState {
  const seed = opts.seed ?? hashString(id);
  const prospects = generateProspects(seed);
  const prospect = prospects[clamp(opts.prospectIndex ?? 0, 0, prospects.length - 1)];
  const world = generateWorld(seed);
  const you = makeYou(seed, prospect);
  const state: CareerState = {
    id, seed,
    week: 1, season: 0, phase: 'prologue',
    you,
    clubId: prospect.clubId,
    training: { primary: 'technical', secondary: 'physical', intensity: 'balanced' },
    coachRequest: null,
    flags: {},
    tallies: { pro_points: 0, maverick_points: 0, loyalty_points: 0, family_points: 0, wealth_points: 0, leader_points: 0 } as Record<TallyId, number>,
    eventLog: [], inbox: [],
    cooldowns: {}, seasonFired: {},
    ambitions: [],
    milestones: [{
      id: 'ms_start', week: 1, season: 0, kind: 'life',
      title: 'The academy takes you in',
      detail: `${you.name}, ${you.age}, joins the academy. Everything starts here.`,
    }],
    world,
    calendar: buildPrologueCalendar(),
    absoluteWeek: 1,
    endedReason: null,
    lastReports: [],
    offers: [],
    news: [],
    seasonsAtClub: 0,
    prospectIndex: clamp(opts.prospectIndex ?? 0, 0, 2),
    loanFromClubId: null,
    debtWeeks: 0,
    cup: null,
  };
  if (opts.ambitionIds?.length) setAmbitions(state, opts.ambitionIds);
  return state;
}

export function createGame(id: string, opts: CreateCareerOpts = {}): Game {
  const career = createCareer(`${id}_career1`, opts);
  return { id, careers: [career], activeCareerId: career.id };
}

export function getActiveCareer(game: Game): CareerState {
  const c = game.careers.find((x) => x.id === game.activeCareerId);
  if (!c) throw new Error('no active career');
  return c;
}

export function replaceCareer(game: Game, next: CareerState): Game {
  return { ...game, careers: game.careers.map((c) => (c.id === next.id ? next : c)) };
}

/** The two ending-only reflection beats (EVENT_CHAINS §9c) — emergent story, never nagging. */
function pushReflections(state: CareerState): void {
  const add = (title: string, detail: string) =>
    state.milestones.push({ id: `ms_reflect_${title.length}_${state.absoluteWeek}`, week: state.week, season: state.season, title, detail, kind: 'retirement' });
  if ('one_club_icon' in state.flags) {
    add('The What-If', 'One club, one shirt, a statue in waiting. Some nights you wonder what you might have won elsewhere — and most nights, you don’t.');
  }
  if ('low_profile' in state.flags && !('icon_track' in state.flags)) {
    add('The Quiet Craftsman', 'Never a headline, never a scandal — just years of showing up. The ones who know the game know exactly what you were.');
  }
  if ('global_icon' in state.flags || 'icon_track' in state.flags) {
    add('The Show', 'They didn’t always love you, but they never once looked away.');
  }
  if ('pro_track' in state.flags) {
    add('The Standard', 'Somewhere tonight, a coach is telling a teenager about how you trained.');
  }
}

// ---------------------------------------------------------------------------
// dispatch — plain actions, returning a new state
// ---------------------------------------------------------------------------

export function dispatch(input: CareerState, action: Action): CareerState {
  const state = structuredClone(input);
  switch (action.type) {
    case 'setTraining': {
      const { plan } = action;
      if (plan.primary === plan.secondary) throw new Error('primary and secondary focus must differ');
      state.training = { ...plan };
      return state;
    }
    case 'resolveCoachRequest': {
      const req = state.coachRequest;
      if (!req || req.honored !== null) return state;
      req.honored = action.accept;
      const cfg = TRAINING.coachRequest;
      if (action.accept) {
        const secondary = state.training.primary === req.block
          ? state.training.secondary
          : state.training.primary;
        state.training = { ...state.training, primary: req.block, secondary: secondary === req.block ? (req.block === 'technical' ? 'physical' : 'technical') : secondary };
        state.you.standing = clamp(state.you.standing + cfg.standingBonus, 0, 100);
      } else {
        state.you.standing = clamp(state.you.standing - cfg.standingPenalty, 0, 100);
      }
      return state;
    }
    case 'resolveInboxEvent': {
      const idx = state.inbox.findIndex((e) => e.eventId === action.eventId && !e.resolved);
      if (idx < 0) return state;
      const fired = state.inbox[idx];
      const def = EVENT_BY_ID[fired.eventId];
      if (!def) return state;
      const moves: MeterMove[] = [];
      applyEventChoice(state, moves, def, action.choiceIndex);
      // the authored ending: choosing to retire closes the career here and now
      if (fired.eventId === 'evt_retirement_call' && action.choiceIndex === 0) {
        state.endedReason = 'retired';
        state.milestones.push({
          id: `ms_retire_${state.absoluteWeek}`, week: state.week, season: state.season,
          title: 'Retired, on your own terms', detail: `${state.you.career.apps} appearances, ${state.you.career.goals} goals, ${state.you.career.seasons} seasons. An ending you authored.`,
          kind: 'retirement',
        });
        pushReflections(state);
      }
      fired.resolved = true;
      fired.choiceIndex = action.choiceIndex;
      fired.reason = reason(`${def.title} — resolved.`, [
        action.choiceIndex === 0 ? up(def.choices[0].label, 1) : down(def.choices[Math.min(action.choiceIndex, def.choices.length - 1)].label, 1),
      ]);
      state.inbox.splice(idx, 1);
      state.eventLog.push(fired);
      return state;
    }
    case 'setAmbitions': {
      setAmbitions(state, action.defIds);
      return state;
    }
    case 'acceptOffer': {
      acceptOffer(state, action.offerId);
      return state;
    }
    case 'rejectOffer': {
      rejectOffer(state, action.offerId);
      return state;
    }
    case 'requestTransfer': {
      requestTransfer(state);
      return state;
    }
  }
}
