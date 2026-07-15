// League machinery: tables, light-tier match resolution, the mid-season split.
import type { Club, Fixture, LeagueSeason, TableRow, World } from '../types/core';
import { CALENDAR, MATCH } from '../data/constants';
import { roundRobin } from '../worldgen';
import { childSeed, mulberry32, type Rng } from '../rng';

export function clubById(world: World, id: string): Club {
  const c = world.clubs.find((x) => x.id === id);
  if (!c) throw new Error(`unknown club ${id}`);
  return c;
}

export function leagueOf(world: World, clubId: string): LeagueSeason {
  const club = clubById(world, clubId);
  const lg = world.leagues.find((l) => l.nationId === club.nationId && l.division === club.division);
  if (!lg) throw new Error(`no league for ${clubId}`);
  return lg;
}

export function poisson(rng: Rng, lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function expectedGoals(strengthFor: number, strengthAgainst: number): number {
  return Math.max(0.2, MATCH.goalsBase * (1 + MATCH.strengthGoalSlope * (strengthFor - strengthAgainst)));
}

export function resolveFixtureLight(rng: Rng, world: World, fx: Fixture): void {
  const home = clubById(world, fx.homeId);
  const away = clubById(world, fx.awayId);
  fx.homeGoals = poisson(rng, expectedGoals(home.strength + 3, away.strength)); // small home edge
  fx.awayGoals = poisson(rng, expectedGoals(away.strength, home.strength + 3));
  fx.played = true;
}

export function rebuildTable(league: LeagueSeason): void {
  const rows = new Map<string, TableRow>();
  for (const row of league.table) {
    rows.set(row.clubId, { clubId: row.clubId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 });
  }
  for (const fx of league.fixtures) {
    if (!fx.played) continue;
    const h = rows.get(fx.homeId)!;
    const a = rows.get(fx.awayId)!;
    h.played++; a.played++;
    h.gf += fx.homeGoals; h.ga += fx.awayGoals;
    a.gf += fx.awayGoals; a.ga += fx.homeGoals;
    if (fx.homeGoals > fx.awayGoals) { h.won++; h.points += 3; a.lost++; }
    else if (fx.homeGoals < fx.awayGoals) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; h.points++; a.drawn++; a.points++; }
  }
  league.table = [...rows.values()].sort(
    (x, y) => y.points - x.points || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || (x.clubId < y.clubId ? -1 : 1),
  );
}

/** After the 11-round RR, generate the 5 split rounds (top-6 / bottom-6). */
export function generateSplitFixtures(seed: number, league: LeagueSeason): void {
  rebuildTable(league);
  const ids = league.table.map((r) => r.clubId);
  const groups = [ids.slice(0, 6), ids.slice(6)];
  const splitWeeks = CALENDAR.leagueRoundWeeks.slice(CALENDAR.splitAfterRound); // rounds 12..16
  const rng = mulberry32(childSeed(seed, `split:${league.nationId}:${league.division}`));
  for (const group of groups) {
    const shuffled = [...group];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const rounds = roundRobin(shuffled); // 5 rounds of 3 matches
    rounds.forEach((round, ri) => {
      const week = splitWeeks[ri];
      for (const [homeId, awayId] of round) {
        league.fixtures.push({ week, homeId, awayId, played: false, homeGoals: 0, awayGoals: 0 });
      }
    });
  }
}

/** Resolve every unplayed fixture of this week across all leagues except skipId. */
export function resolveWorldWeek(seed: number, world: World, week: number, absoluteWeek: number, skipFixture: Fixture | null): void {
  for (const league of world.leagues) {
    const rng = mulberry32(childSeed(seed, `world:${league.nationId}:${league.division}:${absoluteWeek}`));
    for (const fx of league.fixtures) {
      if (fx.week !== week || fx.played) continue;
      if (skipFixture && fx === skipFixture) continue;
      resolveFixtureLight(rng, world, fx);
    }
    rebuildTable(league);
  }
}

export function tablePosition(league: LeagueSeason, clubId: string): number {
  return league.table.findIndex((r) => r.clubId === clubId) + 1;
}
