// Deterministic world generation: 12 nations × 24 clubs × persistent rosters,
// plus prospects and calendars. Everything derives from the career seed.
import type {
  Attributes, AttributeId, Calendar, Club, CulturalProfile, Fixture, LeagueSeason,
  NationId, NpcPlayer, Position, World, You,
} from './types/core';
import { NATIONS, NAME_POOLS, NATION_TEXTURE } from './data/nations';
import { CALENDAR, SQUAD, WORLD } from './data/constants';
import { LIFE } from './data/lifeConfig';
import { TRAINING } from './data/trainingConfig';
import { childSeed, clamp, gauss, mulberry32, pick, rint, type Rng } from './rng';

const CLUB_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#d35400', '#2c3e50', '#e74c3c', '#3498db', '#1abc9c', '#f1c40f'];

const POSITIONS: Position[] = ['ST', 'CM', 'CB'];
const ATTRS: AttributeId[] = ['finishing', 'passing', 'control', 'pace', 'strength', 'stamina', 'composure', 'positioning'];

let npcCounter = 0;

function npcName(rng: Rng, nationId: NationId): string {
  const pool = NAME_POOLS[nationId];
  return `${pick(rng, pool.first)} ${pick(rng, pool.last)}`;
}

function makeNpc(rng: Rng, nationId: NationId, clubId: string, position: Position, clubStrength: number, squad: 'senior' | 'youth'): NpcPlayer {
  const youth = squad === 'youth';
  const age = youth ? rint(rng, WORLD.youthAgeRange[0], WORLD.youthAgeRange[1]) : rint(rng, WORLD.npcAgeRange[0], WORLD.npcAgeRange[1]);
  const base = youth ? clubStrength - 25 : clubStrength;
  const ability = clamp(base + gauss(rng) * 7, 20, 95);
  const potential = youth
    ? clamp(ability + 15 + rng() * 25, ability, 98)
    : clamp(ability + Math.max(0, (27 - age)) * 1.5 * rng(), ability, 98);
  return {
    id: `npc_${npcCounter++}`,
    name: npcName(rng, nationId),
    nationId, position, age,
    ability: Math.round(ability * 10) / 10,
    potential: Math.round(potential * 10) / 10,
    form: clamp(6 + gauss(rng) * 0.5, 4, 8),
    clubId, squad,
  };
}

/** Round-robin fixture rounds for an even list of club ids (circle method). */
export function roundRobin(clubIds: string[]): Array<Array<[string, string]>> {
  const n = clubIds.length;
  const rounds: Array<Array<[string, string]>> = [];
  const arr = [...clubIds];
  for (let r = 0; r < n - 1; r++) {
    const round: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      // alternate home/away by round for variety
      round.push(r % 2 === 0 ? [a, b] : [b, a]);
    }
    rounds.push(round);
    // rotate all but first
    arr.splice(1, 0, arr.pop() as string);
  }
  return rounds;
}

function buildLeague(rng: Rng, nationId: NationId, division: 1 | 2, clubs: Club[]): LeagueSeason {
  const ids = clubs.map((c) => c.id);
  // shuffle for schedule variety
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const rounds = roundRobin(ids); // 11 rounds
  const fixtures: Fixture[] = [];
  rounds.forEach((round, ri) => {
    const week = CALENDAR.leagueRoundWeeks[ri];
    for (const [homeId, awayId] of round) {
      fixtures.push({ week, homeId, awayId, played: false, homeGoals: 0, awayGoals: 0 });
    }
  });
  // split rounds (12..16) are generated mid-season once the table is known
  return {
    nationId, division, fixtures,
    table: ids.map((clubId) => ({ clubId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 })),
  };
}

export function generateWorld(seed: number): World {
  npcCounter = 0;
  const rng = mulberry32(childSeed(seed, 'world'));
  const clubs: Club[] = [];
  const players: NpcPlayer[] = [];
  const leagues: LeagueSeason[] = [];

  for (const nation of NATIONS) {
    const pool = NAME_POOLS[nation.id];
    for (let d = 0; d < 2; d++) {
      const division = (d + 1) as 1 | 2;
      const divClubs: Club[] = [];
      for (let i = 0; i < WORLD.clubsPerDivision; i++) {
        const stem = pool.cityStems[i];
        const pattern = pool.clubPatterns[(i + d) % 2];
        const name = pattern.replace('{c}', stem);
        const strength = clamp(nation.strength - (division === 2 ? 16 : 0) + (11 - i) * 1.1 + gauss(rng) * 2, 30, 92);
        const club: Club = {
          id: `${nation.id}_d${division}_${i}`,
          nationId: nation.id, division, name,
          short: stem.replace(/[^A-Za-zÀ-ÿ]/g, '').slice(0, 3).toUpperCase(),
          strength: Math.round(strength),
          budgetTier: clamp(Math.round(strength / 20), 1, 5),
          color: CLUB_COLORS[i % CLUB_COLORS.length],
        };
        divClubs.push(club);
        clubs.push(club);
        // roster
        for (const pos of POSITIONS) {
          const count = SQUAD.roster[pos];
          for (let k = 0; k < count; k++) players.push(makeNpc(rng, nation.id, club.id, pos, club.strength, 'senior'));
        }
        for (let k = 0; k < SQUAD.youthPerClub; k++) {
          players.push(makeNpc(rng, nation.id, club.id, pick(rng, POSITIONS), club.strength, 'youth'));
        }
      }
      leagues.push(buildLeague(mulberry32(childSeed(seed, `league:${nation.id}:${division}`)), nation.id, division, divClubs));
    }
  }

  return { nations: NATIONS, clubs, players, leagues };
}

// ---------------------------------------------------------------------------
// Prospects — three backstories, not stat sheets
// ---------------------------------------------------------------------------

export interface Prospect {
  name: string;
  nationId: NationId;
  position: Position;
  clubId: string;
  backstory: string;
  attributes: Attributes;
  potential: Attributes;
  potentialBand: 'Rotation' | 'Regular' | 'Star';
  profile: CulturalProfile;
}

const BACKSTORIES: Record<Position, string> = {
  ST: 'Grew up finishing chances against kids two years older. Scouts call the movement "unteachable" — the rest, they say, needs work.',
  CM: 'The one who always wanted the ball, even at 1–0 down away. Sees passes before they exist; still learning when not to try them.',
  CB: 'Reads danger like weather. Coaches love the timing; opponents remember the shoulder. Quietly ambitious, louder on the pitch.',
};

function rollAttributes(rng: Rng, position: Position): { attributes: Attributes; potential: Attributes; band: 'Rotation' | 'Regular' | 'Star' } {
  const attributes = {} as Attributes;
  const potential = {} as Attributes;
  const lean: Record<Position, AttributeId[]> = {
    ST: ['finishing', 'pace', 'composure'],
    CM: ['passing', 'stamina', 'composure'],
    CB: ['strength', 'positioning', 'pace'],
  };
  const bandRoll = rng();
  const band: 'Rotation' | 'Regular' | 'Star' = bandRoll < 0.25 ? 'Rotation' : bandRoll < 0.7 ? 'Regular' : 'Star';
  const potBase = band === 'Star' ? 16.5 : band === 'Regular' ? 14.5 : 12.5;
  for (const a of ATTRS) {
    const leaned = lean[position].includes(a);
    const cur = clamp(6.5 + (leaned ? 1.5 : 0) + gauss(rng) * 0.9, 4, 11);
    const pot = clamp(potBase + (leaned ? 1.5 : 0) + gauss(rng) * 1.2, cur + 2, 19.5);
    attributes[a] = Math.round(cur * 10) / 10;
    potential[a] = Math.round(pot * 10) / 10;
  }
  return { attributes, potential, band };
}

export function generateProspects(seed: number): Prospect[] {
  const rng = mulberry32(childSeed(seed, 'prospects'));
  const nations: NationId[] = [];
  while (nations.length < 3) {
    const n = pick(rng, NATIONS).id;
    if (!nations.includes(n)) nations.push(n);
  }
  const positions: Position[] = [...POSITIONS];
  return nations.map((nationId, i) => {
    const position = positions[i];
    const { attributes, potential, band } = rollAttributes(rng, position);
    const texture = NATION_TEXTURE[nationId];
    const nation = NATIONS.find((n) => n.id === nationId)!;
    // a mid-table division-1 club of the home nation hosts the academy
    const clubIndex = rint(rng, 4, 8);
    const clubId = `${nationId}_d1_${clubIndex}`;
    const profile: CulturalProfile = {
      origin: nationId,
      climateOrigin: nation.climate,
      faith: pick(rng, texture.faiths),
      observant: rng() < 0.6,
      familyExpectation: rng() < texture.familyExpectationHighOdds ? 'high' : 'normal',
      homeContinent: nation.continent,
    };
    return {
      name: npcName(rng, nationId),
      nationId, position, clubId,
      backstory: BACKSTORIES[position],
      attributes, potential, potentialBand: band, profile,
    };
  });
}

export function makeYou(seed: number, prospect: Prospect): You {
  const rng = mulberry32(childSeed(seed, 'you'));
  return {
    id: 'you',
    name: prospect.name,
    nationId: prospect.nationId,
    profile: prospect.profile,
    position: prospect.position,
    age: 16,
    birthWeek: rint(rng, 2, 18),
    attributes: { ...prospect.attributes },
    potential: { ...prospect.potential },
    potentialBand: prospect.potentialBand,
    form: 6.0,
    readiness: TRAINING.readiness.start,
    status: 'Youth',
    standing: 50,
    injuryWeeks: 0,
    meters: { ...LIFE.meterStart },
    cash: 5,
    weeklyWage: 1,
    season: { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, ratingSum: 0, ratingCount: 0 },
    career: { apps: 0, goals: 0, assists: 0, seasons: 0 },
    minutesLog: [],
  };
}

export function buildSeniorCalendar(): Calendar {
  const weeks: Calendar['weeks'] = [];
  for (let w = 1; w <= CALENDAR.seniorWeeks; w++) {
    if (w === 1) weeks.push('preseason');
    else if (w === CALENDAR.finaleWeek) weeks.push('finale');
    else if ((CALENDAR.leagueRoundWeeks as readonly number[]).includes(w)) weeks.push('league');
    else weeks.push('rest');
  }
  return { weeks, windowWeeks: [...CALENDAR.windowWeeks], totalWeeks: CALENDAR.seniorWeeks };
}

export function buildPrologueCalendar(): Calendar {
  const weeks: Calendar['weeks'] = [];
  for (let w = 1; w <= CALENDAR.prologueWeeks; w++) {
    if (w === CALENDAR.prologueWeeks) weeks.push('finale');
    else if ((CALENDAR.prologueMatchWeeks as readonly number[]).includes(w)) weeks.push('league');
    else weeks.push('rest');
  }
  return { weeks, windowWeeks: [], totalWeeks: CALENDAR.prologueWeeks };
}
