// Merit-based weekly selection: ability + form + fitness vs positional rivals,
// standing a minor factor. Reveals squad status only — never outcomes.
// One football-real nuance: coaches protect a bench slot for a high-potential
// youngster — that's how a 17-year-old Backup gets his cameos and his debut.
import type { CareerState, NpcPlayer, Reason } from '../types/core';
import { SELECTION, SQUAD } from '../data/constants';
import { weightedAbility } from '../data/positions';
import { childSeed, mulberry32 } from '../rng';
import { reason, up, down, flat } from './reason';

export type Involvement = 'start' | 'sub' | 'out';

export interface SelectionOutcome {
  involvement: Involvement;
  reason: Reason;
  rivals: NpcPlayer[];        // your positional rivals, best first
  yourScore: number;
}

function npcScore(p: NpcPlayer): number {
  return p.ability * SELECTION.wAbility + p.form * 10 * SELECTION.wForm + 70 * SELECTION.wFitness;
}

export function yourSelectionScore(state: CareerState): number {
  const { you } = state;
  return (
    weightedAbility(you.attributes, you.position) * SELECTION.wAbility +
    you.form * 10 * SELECTION.wForm +
    you.readiness * SELECTION.wFitness +
    (you.standing - 50) * SELECTION.standingFactor
  );
}

export function selectWeek(state: CareerState): SelectionOutcome {
  const { you, world, clubId } = state;
  if (you.injuryWeeks > 0) {
    return {
      involvement: 'out',
      reason: reason('Not in the squad — injured.', [down('unavailable until fit', 2)]),
      rivals: [], yourScore: 0,
    };
  }
  const rivals = world.players
    .filter((p) => p.clubId === clubId && p.squad === 'senior' && p.position === you.position)
    .sort((a, b) => npcScore(b) - npcScore(a));

  const slots = SQUAD.slots[you.position];
  const yourScore = yourSelectionScore(state);
  const better = rivals.filter((r) => npcScore(r) > yourScore).length;

  const rivalNote = rivals[0] ? `${rivals[0].name} is the man in possession` : 'the shirt is there to be taken';

  if (better < slots) {
    return {
      involvement: 'start',
      reason: reason('You start — picked on merit.', [
        up('ability + form beat your rivals', 2),
        you.form >= 6.8 ? up('strong recent form', 1) : flat('form steady'),
        you.readiness < 45 ? down('low readiness nearly cost you', 1) : flat('fit and available'),
      ]),
      rivals, yourScore,
    };
  }
  if (better < slots + 2 && npcScore(rivals[better - 1]) - yourScore < SELECTION.subGapMax) {
    return {
      involvement: 'sub',
      reason: reason('Named among the substitutes.', [
        down(`${better} rival${better > 1 ? 's' : ''} ahead of you right now`, 2),
        flat(rivalNote),
        up('close enough to be in the matchday squad', 1),
      ]),
      rivals, yourScore,
    };
  }
  // the development bench: coaches carry a promising kid in the squad
  if (you.age <= 20 && you.readiness >= 35) {
    const rng = mulberry32(childSeed(state.seed, `devbench:${state.absoluteWeek}`));
    const p = SELECTION.devBenchBase
      + (you.standing - 50) / 400
      + (you.potentialBand === 'Star' ? 0.12 : you.potentialBand === 'Regular' ? 0.05 : 0)
      + (you.form - 6) * 0.03;
    if (rng() < p) {
      return {
        involvement: 'sub',
        reason: reason('Named among the substitutes — the coach is developing you.', [
          up('he wants his young players around the first team', 2),
          flat(rivalNote),
          down('on pure merit the senior men are still ahead', 1),
        ]),
        rivals, yourScore,
      };
    }
  }
  return {
    involvement: 'out',
    reason: reason('Left out of the squad.', [
      down('rivals clearly ahead on ability and form', 2),
      flat(rivalNote),
      you.standing < 40 ? down('your standing with the coach is low', 1) : flat('keep training, take your chance'),
    ]),
    rivals, yourScore,
  };
}
