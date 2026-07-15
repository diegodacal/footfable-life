// National teams & the quadrennial Global Cup (32 nations: 12 real + 20
// minnows). ENGINE INVARIANT: selection pools by BIRTH NATION over the
// nation's entire worldwide population — the club you play for is irrelevant
// to eligibility. A call-up finds you in any league on earth.
import type { CareerState, GlobalCupState, Position, Reason } from '../types/core';
import { NATION_BY_ID } from '../data/nations';
import { weightedAbility } from '../data/positions';
import { childSeed, clamp, mulberry32, pick, rint } from '../rng';
import { reason, up, down, flat } from './reason';

export const GLOBAL_CUP_EVERY = 4;            // seasons
export const CUP_GROUP_WEEKS = 3;

/** 20 minnow nations — national teams only, generated fresh each tournament. */
const MINNOWS: Array<{ name: string; strength: number }> = [
  { name: 'Egypt', strength: 62 }, { name: 'Ghana', strength: 63 }, { name: 'Senegal', strength: 65 },
  { name: 'Cameroon', strength: 61 }, { name: 'Ivory Coast', strength: 62 }, { name: 'Tunisia', strength: 58 },
  { name: 'USA', strength: 60 }, { name: 'Canada', strength: 54 }, { name: 'Colombia', strength: 66 },
  { name: 'Chile', strength: 60 }, { name: 'Peru', strength: 56 }, { name: 'Uruguay', strength: 68 },
  { name: 'Ecuador', strength: 59 }, { name: 'Australia', strength: 57 }, { name: 'New Zealand', strength: 48 },
  { name: 'Saudi Arabia', strength: 55 }, { name: 'Qatar', strength: 50 }, { name: 'Iran', strength: 58 },
  { name: 'Uzbekistan', strength: 52 }, { name: 'Indonesia', strength: 47 },
];

const NT_QUOTA: Record<Position, number> = { ST: 4, CM: 8, CB: 6 };

export function isGlobalCupSeason(season: number): boolean {
  return season > 0 && season % GLOBAL_CUP_EVERY === 0;
}

/** Average of a nation's best XI, drawn from its worldwide population. */
export function nationalTeamStrength(state: CareerState, nationId: string): number {
  const pool = state.world.players
    .filter((p) => p.nationId === nationId && p.squad === 'senior')
    .sort((a, b) => b.ability - a.ability)
    .slice(0, 11);
  if (pool.length === 0) return 50;
  return pool.reduce((a, p) => a + p.ability, 0) / pool.length;
}

/** Pure merit: are you top-quota for your position among your BIRTH nation's players? */
export function selectionVerdict(state: CareerState): { called: boolean; rank: number; reason: Reason } {
  const { you } = state;
  const yourScore = weightedAbility(you.attributes, you.position) * 0.7 + you.form * 10 * 0.3;
  const rivals = state.world.players
    .filter((p) => p.nationId === you.nationId && p.squad === 'senior' && p.position === you.position)
    .map((p) => p.ability * 0.7 + p.form * 10 * 0.3)
    .sort((a, b) => b - a);
  const rank = rivals.filter((s) => s > yourScore).length + 1;
  const quota = NT_QUOTA[you.position];
  const called = rank <= quota;
  const nation = NATION_BY_ID[you.nationId];
  return {
    called, rank,
    reason: called
      ? reason(`Called up by ${nation.name} — pure merit.`, [
          up(`${ordRank(rank)} among ${nation.demonym} ${you.position}s worldwide, by ability and form`, 2),
          flat('the selectors don’t care where you play — only how'),
        ])
      : reason(`No call from ${nation.name} this time.`, [
          down(`${ordRank(rank)} among ${nation.demonym} ${you.position}s — the quota is ${quota}`, 2),
          up('close the gap with form; the next cycle will come', 1),
        ]),
  };
}

function ordRank(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function initGlobalCup(state: CareerState): GlobalCupState {
  const rng = mulberry32(childSeed(state.seed, `cup:s${state.season}`));
  const verdict = selectionVerdict(state);
  // your group: 3 opponents from the other 11 real nations + minnows
  const others = state.world.nations.filter((n) => n.id !== state.you.nationId)
    .map((n) => ({ name: n.name, strength: nationalTeamStrength(state, n.id) }));
  const pool = [...others, ...MINNOWS.map((m) => ({ ...m, strength: m.strength + rint(rng, -3, 3) }))];
  const group: Array<{ name: string; strength: number }> = [];
  while (group.length < 3) {
    const cand = pick(rng, pool);
    if (!group.some((g) => g.name === cand.name)) group.push(cand);
  }
  return {
    seasonHeld: state.season,
    called: verdict.called,
    callReason: verdict.reason,
    groupOpponents: group,
    groupGamesPlayed: 0,
    groupPoints: 0,
    eliminated: false,
    finishText: null,
    champion: null,
    yourGoals: 0,
  };
}

/** Resolve the whole knockout stage in one dramatic week. */
export function resolveKnockout(state: CareerState): { lines: string[]; champion: string; yourRun: string } {
  const cup = state.cup!;
  const rng = mulberry32(childSeed(state.seed, `knockout:s${state.season}`));
  const you = NATION_BY_ID[state.you.nationId];
  const yourStrength = nationalTeamStrength(state, you.id) + (cup.called ? 2 : 0);
  const lines: string[] = [];
  const advanced = cup.groupPoints >= 5 || (cup.groupPoints === 4 && rng() < 0.7);

  let yourRun: string;
  let stillIn = advanced && !cup.eliminated;
  const rounds = ['the Round of 16', 'the quarter-final', 'the semi-final', 'the final'];
  let exitRound = -1;
  if (!stillIn) {
    yourRun = cup.called
      ? `${you.name} exit at the group stage. A hard lesson on the biggest stage.`
      : `${you.name} exit at the groups. You watched it from the sofa — fuel for the next cycle.`;
  } else {
    for (let r = 0; r < rounds.length && stillIn; r++) {
      const opp = pick(rng, [...MINNOWS, { name: 'the hosts', strength: 70 }]);
      const winP = clamp(0.5 + (yourStrength - opp.strength - 4 + r * 2) * 0.02, 0.2, 0.85);
      if (rng() < winP) {
        lines.push(`${you.name} win ${rounds[r]} against ${opp.name}.`);
        if (r === rounds.length - 1) {
          yourRun = `${you.name} are CHAMPIONS OF THE WORLD.`;
          lines.push(yourRun);
          state.milestones.push({
            id: `ms_globalcup_${state.absoluteWeek}`, week: state.week, season: state.season,
            title: 'GLOBAL CUP CHAMPIONS', detail: cup.called ? `And you were on the pitch for it. Immortality.` : `Your country on top of the world.`,
            kind: 'trophy',
          });
          cup.champion = you.name;
          return { lines, champion: you.name, yourRun };
        }
      } else {
        exitRound = r;
        stillIn = false;
      }
    }
    yourRun = `${you.name} fall in ${rounds[Math.max(exitRound, 0)]}. ${cup.called ? 'You gave what you had.' : ''}`;
    lines.push(yourRun);
  }
  // someone else wins it
  const contenders = state.world.nations.filter((n) => n.id !== you.id);
  const winner = pick(rng, contenders);
  cup.champion = winner.name;
  lines.push(`${winner.name} lift the Global Cup.`);
  return { lines, champion: winner.name, yourRun };
}

export function minnowsList(): typeof MINNOWS {
  return MINNOWS;
}
