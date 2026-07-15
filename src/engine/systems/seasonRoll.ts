// Season rollover helpers: fresh fixtures for every league.
// (Promotion/relegation and the demographic tick arrive in M2.)
import type { CareerState, Fixture, LeagueSeason } from '../types/core';
import { CALENDAR } from '../data/constants';
import { childSeed, mulberry32 } from '../rng';
import { roundRobin } from '../worldgen';

export function generateFreshLeagues(state: CareerState): void {
  for (const league of state.world.leagues) {
    const ids = league.table.map((r) => r.clubId);
    const rng = mulberry32(childSeed(state.seed, `fixtures:s${state.season}:${league.nationId}:${league.division}`));
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
    league.fixtures = fixtures;
    resetTable(league);
  }
}

function resetTable(league: LeagueSeason): void {
  league.table = league.table.map((r) => ({
    clubId: r.clubId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0,
  }));
}
