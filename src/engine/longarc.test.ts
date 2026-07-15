// M3 tests: the Global Cup (birth-nation invariant under transfers), career
// endings (authored retirement, broke), loans, and the long multi-season arc.
import { describe, it, expect } from 'vitest';
import {
  createCareer, tick, dispatch, isGlobalCupSeason, selectionVerdict,
  nationalTeamStrength, CALENDAR, clubById,
} from './index';
import type { CareerState } from './index';
import { buildSeniorCalendar } from './worldgen';

function toSenior(label: string, seed: number): CareerState {
  let state = createCareer(label, { seed });
  for (let i = 0; i < CALENDAR.prologueWeeks; i++) state = tick(state).state;
  return state;
}

function playSeason(state: CareerState): CareerState {
  const ticks = state.calendar.totalWeeks - state.week + 1;
  for (let i = 0; i < ticks; i++) {
    if (state.endedReason) break;
    state = tick(state).state;
  }
  return state;
}

describe('the Global Cup', () => {
  it('cup seasons carry the tournament block in the calendar', () => {
    expect(buildSeniorCalendar(false).totalWeeks).toBe(20);
    const cupCal = buildSeniorCalendar(true);
    expect(cupCal.totalWeeks).toBe(24);
    expect(cupCal.weeks.filter((w) => w === 'cup')).toHaveLength(4);
    expect(cupCal.weeks[cupCal.totalWeeks - 1]).toBe('finale');
    expect(isGlobalCupSeason(4)).toBe(true);
    expect(isGlobalCupSeason(3)).toBe(false);
  });

  it('NT selection pools by BIRTH NATION worldwide — a transfer abroad never changes it', () => {
    const state = toSenior('nt', 9001);
    const before = selectionVerdict(state);
    // move to a foreign club by hand — selection input must be unchanged
    const foreign = state.world.clubs.find((c) => c.nationId !== state.you.nationId)!;
    state.clubId = foreign.id;
    const after = selectionVerdict(state);
    expect(after.rank).toBe(before.rank);           // club is irrelevant to eligibility
    expect(after.reason.headline).toContain(state.world.nations.find((n) => n.id === state.you.nationId)!.name);
  });

  it('NT strength draws on the nation’s players wherever they play', () => {
    const state = toSenior('ntstr', 9002);
    const nation = state.you.nationId;
    const s1 = nationalTeamStrength(state, nation);
    // ship the nation's best player abroad; strength must not change
    const best = state.world.players
      .filter((p) => p.nationId === nation && p.squad === 'senior')
      .sort((a, b) => b.ability - a.ability)[0];
    const foreign = state.world.clubs.find((c) => c.nationId !== nation)!;
    best.clubId = foreign.id;
    expect(nationalTeamStrength(state, nation)).toBeCloseTo(s1, 5);
  });

  it('a cup season runs the tournament: selection verdict, group games or news, a champion', () => {
    let state = toSenior('cupseason', 9003);
    // play to season 4 (the first Global Cup)
    for (let s = 1; s < 4; s++) state = playSeason(state);
    expect(state.season).toBe(4);
    expect(state.calendar.totalWeeks).toBe(24);
    state = playSeason(state);
    if (state.endedReason) return; // broke runs can end early on wild seeds
    expect(state.season).toBe(5);
    // the tournament concluded: milestone or news carries the story
    const hadCup = state.milestones.some((m) => m.kind === 'callup') || state.news.some((n) => n.text.includes('Global Cup') || n.text.includes('lift'));
    expect(hadCup).toBe(true);
  });
});

describe('career endings', () => {
  it('the retirement question arrives from age 33; choosing it ends the career AUTHORED', () => {
    let state = toSenior('retire', 9010);
    state.you.age = 33;
    state = playSeason(state);
    const call = state.inbox.find((e) => e.eventId === 'evt_retirement_call');
    expect(call).toBeDefined();
    const ended = dispatch(state, { type: 'resolveInboxEvent', eventId: 'evt_retirement_call', choiceIndex: 0 });
    expect(ended.endedReason).toBe('retired');
    expect(ended.milestones.some((m) => m.kind === 'retirement')).toBe(true);
  });

  it('choosing one more year keeps the career alive', () => {
    let state = toSenior('onemore', 9011);
    state.you.age = 33;
    state = playSeason(state);
    const kept = dispatch(state, { type: 'resolveInboxEvent', eventId: 'evt_retirement_call', choiceIndex: 1 });
    expect(kept.endedReason).toBeNull();
  });

  it('sustained debt ends in broke — telegraphed, never sudden', () => {
    let state = toSenior('broke', 9012);
    state.you.cash = -50;
    state.you.weeklyWage = 0;          // no income: the spiral is unrecoverable
    let warned = false;
    for (let i = 0; i < 20 && !state.endedReason; i++) {
      state = tick(state).state;
      if (state.news.some((n) => n.text.includes('accountant') || n.text.includes('WARNING'))) warned = true;
    }
    expect(state.endedReason).toBe('broke');
    expect(warned).toBe(true);        // the player saw it coming
  });

  it('a finished career refuses to advance', () => {
    let state = toSenior('dead', 9013);
    state.endedReason = 'retired';
    expect(() => tick(state)).toThrow();
  });
});

describe('loans', () => {
  it('a loan moves you out and the season boundary brings you home', () => {
    let state = toSenior('loan', 9014);
    const parent = state.clubId;
    // force a loan by hand (the offer path is window+rng gated)
    const myClub = clubById(state.world, parent);
    const dest = state.world.clubs.find((c) => c.nationId === myClub.nationId && c.strength < myClub.strength - 8)!;
    state.offers.push({
      id: 'loan_test', clubId: dest.id, rolePromise: 'Regular', wageMult: 1, loan: true,
      expiresWeek: state.absoluteWeek + 4, reason: { headline: 'loan', factors: [] },
    });
    state = dispatch(state, { type: 'acceptOffer', offerId: 'loan_test' });
    expect(state.clubId).toBe(dest.id);
    expect(state.loanFromClubId).toBe(parent);
    state = playSeason(state);
    expect(state.clubId).toBe(parent);             // home again
    expect(state.loanFromClubId).toBeNull();
    expect(state.milestones.some((m) => m.title.startsWith('Back at'))).toBe(true);
  });
});

describe('the long arc holds together', () => {
  it('eight seasons headless: ages, stages, world intact, story accumulating', () => {
    let state = toSenior('marathon', 9020);
    for (let s = 0; s < 8 && !state.endedReason; s++) state = playSeason(state);
    if (!state.endedReason) {
      expect(state.you.age).toBeGreaterThanOrEqual(24);
      expect(state.world.players.length).toBeGreaterThan(6000);
      expect(state.world.leagues).toHaveLength(24);
      expect(state.milestones.length).toBeGreaterThan(10);
      expect(state.you.career.seasons).toBeGreaterThanOrEqual(8);
    }
  });
});
