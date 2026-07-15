// Season rollover: promotion/relegation, the demographic tick (the world ages
// whether or not you watch it — in GAME time only), and fresh fixtures.
import type { CareerState, Fixture, LeagueSeason, NationId, NpcPlayer, Position } from '../types/core';
import { CALENDAR, SQUAD, WORLD } from '../data/constants';
import { NAME_POOLS, NATION_BY_ID } from '../data/nations';
import { childSeed, clamp, gauss, mulberry32, pick, rint, type Rng } from '../rng';
import { roundRobin } from '../worldgen';
import { rebuildTable } from './league';

const POSITIONS: Position[] = ['ST', 'CM', 'CB'];

export function rollSeason(state: CareerState): void {
  promotionRelegation(state);
  demographicTick(state);
  generateFreshLeagues(state);
  state.seasonsAtClub++;
}

// ---------------------------------------------------------------------------
// Promotion & relegation: bottom 2 of Div 1 swap with top 2 of Div 2
// ---------------------------------------------------------------------------

export function promotionRelegation(state: CareerState): void {
  for (const nation of state.world.nations) {
    const d1 = state.world.leagues.find((l) => l.nationId === nation.id && l.division === 1);
    const d2 = state.world.leagues.find((l) => l.nationId === nation.id && l.division === 2);
    if (!d1 || !d2 || d1.table.some((r) => r.played === 0)) continue;
    rebuildTable(d1); rebuildTable(d2);
    const down = d1.table.slice(-2).map((r) => r.clubId);
    const up = d2.table.slice(0, 2).map((r) => r.clubId);
    for (const id of down) {
      const club = state.world.clubs.find((c) => c.id === id)!;
      club.division = 2;
      if (id === state.clubId) {
        state.milestones.push({
          id: `ms_releg_${state.absoluteWeek}`, week: state.week, season: state.season,
          title: 'Relegated', detail: `${club.name} go down. Loyalty is about to mean something.`, kind: 'season',
        });
      }
    }
    for (const id of up) {
      const club = state.world.clubs.find((c) => c.id === id)!;
      club.division = 1;
      if (id === state.clubId) {
        state.milestones.push({
          id: `ms_promo_${state.absoluteWeek}`, week: state.week, season: state.season,
          title: 'PROMOTED', detail: `${club.name} go up — top-flight football arrives.`, kind: 'trophy',
        });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// The demographic tick
// ---------------------------------------------------------------------------

export function demographicTick(state: CareerState): void {
  const rng = mulberry32(childSeed(state.seed, `demo:s${state.season}`));
  const survivors: NpcPlayer[] = [];
  const retirees: NpcPlayer[] = [];

  for (const p of state.world.players) {
    p.age++;
    // ability follows the age curve
    if (p.age <= 21) p.ability = clamp(p.ability + 2 + rng() * 3, 20, p.potential);
    else if (p.age <= 29) p.ability = clamp(p.ability + gauss(rng) * 1.2, 20, p.potential);
    else p.ability = clamp(p.ability - (1 + (p.age - 29) * 0.7) - rng(), 20, 99);
    // retirement (NPCs only — YOUR ending is authored, M3)
    const pRetire = p.age >= 38 ? 1 : p.age >= 34 ? (p.age - 33) * 0.28 + (p.ability < 45 ? 0.2 : 0) : 0;
    if (rng() < pRetire) { retirees.push(p); continue; }
    // youth age out at 19: promoted if there's headroom, else released into the pool
    if (p.squad === 'youth' && p.age >= 19) p.squad = 'senior';
    survivors.push(p);
  }
  state.world.players = survivors;

  if (retirees.length > 0) {
    const famous = retirees.sort((a, b) => b.ability - a.ability)[0];
    state.news.unshift({ season: state.season, week: 1, text: `${famous.name}, ${famous.age}, hangs up his boots.` });
  }

  // refill every roster to its caps
  let regenCount = 0;
  for (const club of state.world.clubs) {
    for (const pos of POSITIONS) {
      const seniors = state.world.players.filter((p) => p.clubId === club.id && p.squad === 'senior' && p.position === pos);
      const cap = SQUAD.roster[pos];
      for (let i = seniors.length; i < cap; i++) {
        state.world.players.push(makeRegen(rng, club.nationId, club.id, pos, club.strength, 'senior'));
        regenCount++;
      }
      // trim overfull lines (aged-up youth can overflow): weakest drop to free agency
      if (seniors.length > cap) {
        const excess = seniors.sort((a, b) => a.ability - b.ability).slice(0, seniors.length - cap);
        for (const p of excess) p.clubId = null;
      }
    }
    const youth = state.world.players.filter((p) => p.clubId === club.id && p.squad === 'youth');
    for (let i = youth.length; i < SQUAD.youthPerClub; i++) {
      state.world.players.push(makeRegen(rng, club.nationId, club.id, pick(rng, POSITIONS), club.strength, 'youth'));
      regenCount++;
    }
  }
  void regenCount;
}

let regenSerial = 0;
function makeRegen(rng: Rng, nationId: NationId, clubId: string, position: Position, clubStrength: number, squad: 'senior' | 'youth'): NpcPlayer {
  const pool = NAME_POOLS[nationId];
  const youth = squad === 'youth';
  const age = youth ? rint(rng, WORLD.youthAgeRange[0], WORLD.youthAgeRange[1]) : rint(rng, 19, 24);
  const base = youth ? clubStrength - 25 : clubStrength - 8;
  const ability = clamp(base + gauss(rng) * 6, 20, 90);
  return {
    id: `regen_${regenSerial++}_${nationId}`,
    name: `${pick(rng, pool.first)} ${pick(rng, pool.last)}`,
    nationId, position, age,
    ability: Math.round(ability * 10) / 10,
    potential: clamp(ability + 10 + rng() * 25, ability, 97),
    form: clamp(6 + gauss(rng) * 0.4, 4.5, 7.5),
    clubId, squad,
  };
}

// ---------------------------------------------------------------------------
// Fresh fixtures for the new season (league membership from club.division)
// ---------------------------------------------------------------------------

export function generateFreshLeagues(state: CareerState): void {
  const leagues: LeagueSeason[] = [];
  for (const nation of state.world.nations) {
    for (const division of [1, 2] as const) {
      const clubIds = state.world.clubs.filter((c) => c.nationId === nation.id && c.division === division).map((c) => c.id);
      const rng = mulberry32(childSeed(state.seed, `fixtures:s${state.season}:${nation.id}:${division}`));
      const ids = [...clubIds];
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      const rounds = roundRobin(ids);
      const fixtures: Fixture[] = [];
      rounds.forEach((round, ri) => {
        const week = CALENDAR.leagueRoundWeeks[ri];
        for (const [homeId, awayId] of round) {
          fixtures.push({ week, homeId, awayId, played: false, homeGoals: 0, awayGoals: 0 });
        }
      });
      leagues.push({
        nationId: nation.id, division, fixtures,
        table: ids.map((clubId) => ({ clubId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 })),
      });
    }
  }
  state.world.leagues = leagues;
  void NATION_BY_ID;
}
