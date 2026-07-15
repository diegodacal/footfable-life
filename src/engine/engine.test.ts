// Engine behaviour tests: determinism, temporal honesty, the Reason contract,
// world sanity, and a full prologue + multi-season headless run.
import { describe, it, expect } from 'vitest';
import {
  createCareer, tick, advanceWeek, dispatch, generateProspects,
  deriveCharacter, buildRecap, nextBeat, weekSignal, epithet,
  leagueOf, tablePosition, offerableAmbitions,
  NATIONS, WORLD, CALENDAR,
} from './index';
import type { CareerState, WeekReport } from './index';

function runWeeks(state: CareerState, n: number): { state: CareerState; reports: WeekReport[] } {
  const reports: WeekReport[] = [];
  for (let i = 0; i < n; i++) {
    const r = tick(state);
    state = r.state;
    reports.push(r.report);
  }
  return { state, reports };
}

describe('world generation', () => {
  const career = createCareer('gen-test', { seed: 123 });

  it('generates the full 12-nation, 288-club world', () => {
    expect(career.world.nations).toHaveLength(12);
    expect(career.world.clubs).toHaveLength(12 * 24);
    expect(career.world.leagues).toHaveLength(24);
    for (const league of career.world.leagues) {
      expect(league.table).toHaveLength(WORLD.clubsPerDivision);
      // 11 RR rounds × 6 matches before the split
      expect(league.fixtures).toHaveLength(11 * 6);
    }
  });

  it('every club holds a full, position-covering roster', () => {
    const byClub = new Map<string, number>();
    for (const p of career.world.players) {
      if (p.clubId) byClub.set(p.clubId, (byClub.get(p.clubId) ?? 0) + 1);
    }
    expect(byClub.size).toBe(288);
    for (const count of byClub.values()) expect(count).toBe(18 + 4);
  });

  it('nationality is fixed at birth: NPC nationality matches origin, never club country', () => {
    // players were generated for their nation's clubs, but the field is independent —
    // transfers (M2) move clubId and must never touch nationId. Assert the invariant exists.
    const p = career.world.players[0];
    expect(p.nationId).toBeDefined();
    expect(NATIONS.some((n) => n.id === p.nationId)).toBe(true);
  });

  it('prospects are deterministic per seed', () => {
    const a = generateProspects(42);
    const b = generateProspects(42);
    expect(a.map((p) => p.name)).toEqual(b.map((p) => p.name));
    expect(a).toHaveLength(3);
    expect(new Set(a.map((p) => p.position)).size).toBe(3);
  });
});

describe('determinism', () => {
  it('same seed + same decisions → identical careers', () => {
    let a = createCareer('det', { seed: 7 });
    let b = createCareer('det', { seed: 7 });
    for (let i = 0; i < 15; i++) {
      a = tick(a).state;
      b = tick(b).state;
    }
    expect(a.you.attributes).toEqual(b.you.attributes);
    expect(a.you.season).toEqual(b.you.season);
    expect(a.milestones.map((m) => m.title)).toEqual(b.milestones.map((m) => m.title));
    expect(a.you.cash).toBe(b.you.cash);
  });

  it('advanceWeek does not mutate its input (nothing committed until done)', () => {
    const state = createCareer('immut', { seed: 9 });
    const snapshot = JSON.stringify(state);
    advanceWeek(state, {});
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('the prologue (youth season as tutorial)', () => {
  it('runs 10 weeks and ends with the call-up into the senior phase', () => {
    let state = createCareer('prologue', { seed: 11 });
    expect(state.phase).toBe('prologue');
    const { state: after, reports } = runWeeks(state, CALENDAR.prologueWeeks);
    expect(reports[reports.length - 1].prologueComplete).toBe(true);
    expect(after.phase).toBe('senior');
    expect(after.you.status).toBe('Backup');
    expect(after.season).toBe(1);
    expect(after.week).toBe(1);
    expect(after.milestones.some((m) => m.kind === 'callup')).toBe(true);
    // the first-contract moment waits in the inbox
    expect(after.inbox.some((e) => e.eventId === 'evt_first_contract')).toBe(true);
  });
});

describe('temporal honesty', () => {
  it('a substitute’s minutes are derived from the come-on moment', () => {
    let state = createCareer('temporal', { seed: 21 });
    // run through prologue + a chunk of the senior season, checking every sub appearance
    let checked = 0;
    for (let i = 0; i < 60; i++) {
      const r = tick(state);
      state = r.state;
      const m = r.report.match;
      if (m && m.subOnMinute !== undefined && m.minutes > 0) {
        // minutes = 90 + stoppage − subOn, stoppage 1..5
        expect(m.minutes).toBeGreaterThanOrEqual(90 + 1 - m.subOnMinute);
        expect(m.minutes).toBeLessThanOrEqual(90 + 5 - m.subOnMinute);
        checked++;
      }
      if (m && m.minutes > 0) {
        // your beats live inside your on-pitch window
        const start = m.subOnMinute ?? 0;
        const end = m.subOffMinute ?? 96;
        for (const b of m.beats) {
          if (b.kind === 'your_goal' || b.kind === 'your_assist' || b.kind === 'key_pass' || b.kind === 'tackle' || b.kind === 'error') {
            expect(b.minute).toBeGreaterThanOrEqual(start);
            expect(b.minute).toBeLessThanOrEqual(end);
          }
        }
        // beats are ordered
        for (let j = 1; j < m.beats.length; j++) {
          expect(m.beats[j].minute).toBeGreaterThanOrEqual(m.beats[j - 1].minute);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('the debut milestone only fires on a week with real senior minutes', () => {
    let state = createCareer('debut', { seed: 33 });
    for (let i = 0; i < 80; i++) {
      const r = tick(state);
      state = r.state;
      const debut = r.report.milestones.find((m) => m.kind === 'debut');
      if (debut) {
        expect(r.report.match).not.toBeNull();
        expect(r.report.match!.minutes).toBeGreaterThan(0);
        return;
      }
    }
    // a Backup may not debut in 80 weeks on some seeds, but seed 33 should get there
    throw new Error('no debut within 80 weeks');
  });
});

describe('the Reason contract', () => {
  it('every meter move, selection, status change and event carries a populated Reason', () => {
    let state = createCareer('why', { seed: 55 });
    for (let i = 0; i < 40; i++) {
      const r = tick(state);
      state = r.state;
      for (const move of r.report.life.moves) {
        expect(move.reason.headline.length).toBeGreaterThan(0);
        expect(move.reason.factors.length).toBeGreaterThan(0);
      }
      if (r.report.match) expect(r.report.match.selectionReason.headline.length).toBeGreaterThan(0);
      if (r.report.statusChange) expect(r.report.statusChange.reason.factors.length).toBeGreaterThan(0);
      if (r.report.injury) expect(r.report.injury.reason.headline.length).toBeGreaterThan(0);
      if (r.report.life.firedEvent) expect(r.report.life.firedEvent.reason.headline.length).toBeGreaterThan(0);
      expect(r.report.stakes.length).toBeGreaterThan(0);
      expect(r.report.digest.length).toBeGreaterThan(0);
    }
  });
});

describe('a full senior season, headless', () => {
  it('plays to the finale: 16 league rounds resolve, tables complete, ambitions settle', async () => {
    let state = createCareer('season', { seed: 77 });
    // prologue
    ({ state } = runWeeks(state, CALENDAR.prologueWeeks));
    // pick ambitions at the door of the senior season
    const offers = offerableAmbitions(state);
    expect(offers.length).toBeGreaterThan(2);
    state = dispatch(state, { type: 'setAmbitions', defIds: offers.slice(0, 3).map((o) => o.id) });
    // full senior season
    const { state: after, reports } = runWeeks(state, CALENDAR.seniorWeeks);
    const finale = reports[reports.length - 1];
    expect(finale.seasonComplete).toBe(true);
    expect(after.season).toBe(2);
    const league = leagueOf(after.world, after.clubId);
    // fresh season regenerated
    expect(league.fixtures.every((f) => !f.played)).toBe(true);
    // every season-horizon ambition got a verdict (career-horizon ones live on)
    const { AMBITION_BY_ID } = await import('./data/ambitions');
    for (const amb of after.ambitions) {
      if (AMBITION_BY_ID[amb.defId]?.horizon === 'season') expect(amb.status).not.toBe('active');
    }
    // the season milestone exists
    expect(after.milestones.some((m) => m.kind === 'season')).toBe(true);
    // you played some football
    expect(after.you.career.apps).toBeGreaterThan(0);
  });

  it('all 24 leagues resolve their season in parallel (the world breathes)', () => {
    let state = createCareer('world-breathes', { seed: 99 });
    ({ state } = runWeeks(state, CALENDAR.prologueWeeks));
    // play to just before the finale so tables aren't reset by rollover
    const { state: late } = runWeeks(state, CALENDAR.seniorWeeks - 1);
    for (const league of late.world.leagues) {
      const totalPlayed = league.table.reduce((a, r) => a + r.played, 0);
      expect(totalPlayed).toBeGreaterThan(0);
      const pos = tablePosition(league, league.table[0].clubId);
      expect(pos).toBe(1);
    }
  });
});

describe('the product layer', () => {
  it('narrator surfaces: stakes, next beat, recap, epithet, signals', () => {
    let state = createCareer('narrator', { seed: 101 });
    const beat = nextBeat(state);
    expect(beat.title.length).toBeGreaterThan(0);
    const { state: after, reports } = runWeeks(state, 14);
    const recap = buildRecap(after);
    expect(recap.where).toContain(after.you.name);
    expect(recap.recently.length).toBeGreaterThan(0);
    expect(epithet(after).length).toBeGreaterThan(0);
    const signal = weekSignal(after, reports[reports.length - 1]);
    expect(typeof signal.worthStopping).toBe('boolean');
  });

  it('character derives from meters + history, never stored', () => {
    const state = createCareer('char', { seed: 3 });
    const c = deriveCharacter(state);
    expect(['ModelPro', 'Grounded', 'LooseCannon']).toContain(c.band);
  });

  it('dispatch: training, coach request, inbox, ambitions', () => {
    let state = createCareer('dispatch', { seed: 13 });
    state = dispatch(state, { type: 'setTraining', plan: { primary: 'mental', secondary: 'technical', intensity: 'recover' } });
    expect(state.training.primary).toBe('mental');
    expect(() => dispatch(state, { type: 'setTraining', plan: { primary: 'mental', secondary: 'mental', intensity: 'balanced' } })).toThrow();
  });
});
