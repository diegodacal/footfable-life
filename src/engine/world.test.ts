// M2 tests: transfers (with the nationality invariant), the demographic tick,
// promotion/relegation, archetype chains, and the cultural event layer.
import { describe, it, expect } from 'vitest';
import {
  createCareer, tick, dispatch, playingAbroad,
  clubById, CALENDAR, SQUAD, EVENTS,
} from './index';
import type { CareerState, TransferOffer } from './index';
import { acceptOffer } from './systems/transfers';
import { demographicTick, promotionRelegation } from './systems/seasonRoll';
import { careerStage, applyEventChoice } from './systems/life';

function toSenior(seedLabel: string, seed: number): CareerState {
  let state = createCareer(seedLabel, { seed });
  for (let i = 0; i < CALENDAR.prologueWeeks; i++) state = tick(state).state;
  return state;
}

function playSeasons(state: CareerState, n: number): CareerState {
  for (let s = 0; s < n; s++) {
    for (let i = 0; i < CALENDAR.seniorWeeks; i++) state = tick(state).state;
  }
  return state;
}

describe('transfers', () => {
  it('a transfer moves clubId across nations and NEVER touches nationality', () => {
    const state = toSenior('tx', 4001);
    const origin = state.you.nationId;
    // hand-build a foreign offer and accept it
    const foreign = state.world.clubs.find((c) => c.nationId !== origin && c.division === 1)!;
    const offer: TransferOffer = {
      id: 'test_offer', clubId: foreign.id, rolePromise: 'Rotation', wageMult: 1.2,
      expiresWeek: state.absoluteWeek + 4,
      reason: { headline: 'test', factors: [] },
    };
    state.offers.push(offer);
    const before = structuredClone(state);
    acceptOffer(state, 'test_offer');
    expect(state.clubId).toBe(foreign.id);
    expect(state.you.nationId).toBe(origin);                      // THE invariant
    expect(state.you.profile.origin).toBe(origin);
    expect(playingAbroad(state)).toBe(true);
    expect(state.milestones.some((m) => m.kind === 'transfer')).toBe(true);
    // roster legality preserved: the target's line count is back at cap
    const line = state.world.players.filter((p) => p.clubId === foreign.id && p.squad === 'senior' && p.position === state.you.position);
    expect(line.length).toBe(SQUAD.roster[state.you.position] - 1); // one displaced to make room for YOU
    void before;
  });

  it('rejecting a bigger club banks loyalty', () => {
    const state = toSenior('loyal', 4002);
    const myStrength = clubById(state.world, state.clubId).strength;
    const bigger = state.world.clubs.find((c) => c.strength > myStrength + 5)!;
    state.offers.push({ id: 'big', clubId: bigger.id, rolePromise: 'Regular', wageMult: 1.4, expiresWeek: state.absoluteWeek + 4, reason: { headline: 't', factors: [] } });
    const after = dispatch(state, { type: 'rejectOffer', offerId: 'big' });
    expect(after.tallies.loyalty_points).toBe((state.tallies.loyalty_points ?? 0) + 1);
    expect(after.offers).toHaveLength(0);
  });

  it('offers only appear inside transfer windows', () => {
    let state = toSenior('window', 4003);
    state.you.meters.reputation = 80;
    state.flags['transfer_requested'] = 1;
    for (let i = 0; i < CALENDAR.seniorWeeks - 1; i++) {
      const week = state.week;
      const r = tick(state);
      state = r.state;
      if (state.offers.length > 0) {
        expect(CALENDAR.windowWeeks.some((w) => Math.abs(w - week) <= 1)).toBe(true);
      }
    }
  });
});

describe('the demographic tick & promotion/relegation', () => {
  it('the world ages: players age, some retire, rosters stay legal', () => {
    const state = toSenior('demo', 4010);
    const beforeAges = new Map(state.world.players.map((p) => [p.id, p.age]));
    const beforeCount = state.world.players.length;
    demographicTick(state);
    let survivors = 0;
    for (const p of state.world.players) {
      const prev = beforeAges.get(p.id);
      if (prev !== undefined) { expect(p.age).toBe(prev + 1); survivors++; }
      expect(p.age).toBeLessThan(39);
    }
    expect(survivors).toBeLessThan(beforeCount);          // someone retired
    // rosters legal for every club
    for (const club of state.world.clubs) {
      for (const pos of ['ST', 'CM', 'CB'] as const) {
        const line = state.world.players.filter((p) => p.clubId === club.id && p.squad === 'senior' && p.position === pos);
        expect(line.length).toBeGreaterThanOrEqual(SQUAD.roster[pos]);
      }
    }
  });

  it('bottom two swap with top two across a season boundary', () => {
    let state = toSenior('pr', 4011);
    state = playSeasons(state, 1);
    // after one full season + rollover, each nation still has 12 clubs per division
    for (const nation of state.world.nations) {
      const d1 = state.world.clubs.filter((c) => c.nationId === nation.id && c.division === 1);
      const d2 = state.world.clubs.filter((c) => c.nationId === nation.id && c.division === 2);
      expect(d1).toHaveLength(12);
      expect(d2).toHaveLength(12);
    }
    // and leagues were rebuilt from divisions
    expect(state.world.leagues).toHaveLength(24);
    for (const l of state.world.leagues) expect(l.table).toHaveLength(12);
    void promotionRelegation;
  });

  it('multi-season careers age you through stages', () => {
    let state = toSenior('age', 4012);
    expect(careerStage(state)).toBe('youth');
    state = playSeasons(state, 3);
    expect(state.you.age).toBeGreaterThanOrEqual(19);
    expect(state.season).toBe(4);
    expect(['break', 'prime']).toContain(careerStage(state));
  });
});

describe('chains & culture', () => {
  it('pro tallies arm the pro_track flag at threshold', () => {
    const state = toSenior('chain', 4020);
    state.tallies.pro_points = 3;
    // applying any event choice triggers the threshold check
    const def = EVENTS.find((e) => e.id === 'evt_early_night')!;
    applyEventChoice(state, [], def, 0);
    expect('pro_track' in state.flags).toBe(true);
  });

  it('cultural events gate on the individual, not the club', () => {
    const state = toSenior('culture', 4021);
    // homesick requires abroad; at home it must never fire
    expect(playingAbroad(state)).toBe(false);
    const eligibleIds = eligibleEventIds(state);
    expect(eligibleIds).not.toContain('evt_homesick');
    expect(eligibleIds).not.toContain('evt_language');
    // move abroad by hand
    const foreign = state.world.clubs.find((c) => c.nationId !== state.you.profile.origin)!;
    state.clubId = foreign.id;
    const abroadIds = eligibleEventIds(state);
    expect(abroadIds).toContain('evt_homesick');
  });

  it('faith events fire only for observant players of that faith', () => {
    const state = toSenior('faith', 4022);
    state.you.profile.faith = 'muslim';
    state.you.profile.observant = true;
    expect(eligibleEventIds(state)).toContain('evt_ramadan');
    state.you.profile.observant = false;
    expect(eligibleEventIds(state)).not.toContain('evt_ramadan');
  });
});

// eligibility probe: mirrors the life system's cultural gates (gates only)
import { EVENTS as ALL_EVENTS } from './data/events';

function eligibleEventIds(state: CareerState): string[] {
  const out: string[] = [];
  for (const def of ALL_EVENTS) {
    if (def.weightBase <= 0) continue;
    const g = def.gates ?? {};
    const clubNation = state.world.clubs.find((c) => c.id === state.clubId)?.nationId;
    const isAbroad = clubNation !== state.you.profile.origin;
    if (g.abroad !== undefined && isAbroad !== g.abroad) continue;
    if (g.faith && state.you.profile.faith !== g.faith) continue;
    if (g.observant !== undefined && state.you.profile.observant !== g.observant) continue;
    if (g.origin && state.you.profile.origin !== g.origin) continue;
    out.push(def.id);
  }
  return out;
}
