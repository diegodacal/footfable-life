// Match resolution with temporal honesty (handoff §7):
// - the sub's come-on minute is modelled FIRST; minutes are derived from it
// - your involvement beats exist only inside your on-pitch window
// - beats are an ordered feed; the scoreboard is derivable only from revealed beats
// - a debut/sub-on is a hard stop; decisions pause the week (needs-match)
import type {
  CareerState, Fixture, MatchBeat, MatchDecisionDef, MatchResult, Position, Reason,
} from '../types/core';
import { MATCH } from '../data/constants';
import { weightedAbility } from '../data/positions';
import { clamp, childSeed, gauss, mulberry32, rint, type Rng } from '../rng';
import { expectedGoals, poisson } from './league';
import { readinessRatingMod } from './training';
import type { Involvement } from './selection';

const DECISIONS: Record<Position, MatchDecisionDef> = {
  ST: { id: 'dec_penalty', prompt: 'Penalty! The senior taker nods at you — he’ll give you this one if you want it.', options: ['Step up and take it', 'Let him take it'] },
  CM: { id: 'dec_late_shot', prompt: 'The ball breaks to you 25 yards out, minutes left, defenders closing.', options: ['Shoot from range', 'Recycle possession'] },
  CB: { id: 'dec_last_tackle', prompt: 'Their striker is in on goal. You can lunge — win it clean or give away everything.', options: ['Dive into the tackle', 'Stay on your feet and shepherd'] },
};

interface MatchParams {
  state: CareerState;
  fixture: Fixture;               // your club's fixture (unplayed)
  involvement: Involvement;
  selectionReason: Reason;
  isDebut: boolean;
  decisionChoice?: number;        // if a decision triggers and this is absent -> needs-match
  usName: string;
  usStrength: number;
  opponentName: string;
  opponentStrength: number;
  homeSide: boolean;
}

export type MatchOutcome =
  | { kind: 'result'; result: MatchResult }
  | { kind: 'needs-decision'; decision: MatchDecisionDef; minute: number };

export function resolveMatch(p: MatchParams): MatchOutcome {
  const { state, fixture, involvement, selectionReason, isDebut, opponentName, homeSide } = p;
  const { you } = state;
  const rng = mulberry32(childSeed(state.seed, `match:${state.absoluteWeek}`));
  const us = { name: p.usName, strength: p.usStrength };
  const them = { name: opponentName, strength: p.opponentStrength };

  // --- moments first: when are you on the pitch? -------------------------
  let subOnMinute: number | undefined;
  let subOffMinute: number | undefined;
  let plays = involvement === 'start';
  if (involvement === 'sub') {
    const comesOn = rng() < 0.7;
    if (comesOn) {
      plays = true;
      subOnMinute = rint(rng, MATCH.subOnRange[0], MATCH.subOnRange[1]);
    }
  } else if (involvement === 'start' && rng() < MATCH.subOffChanceStarter) {
    subOffMinute = rint(rng, MATCH.subOffRange[0], MATCH.subOffRange[1]);
  }
  const stoppage = rint(rng, 1, 5);
  const windowStart = subOnMinute ?? 0;
  const windowEnd = subOffMinute ?? 90;
  const minutes = plays
    ? subOnMinute !== undefined
      ? 90 + stoppage - subOnMinute            // derived FROM the moment, never pre-decided
      : subOffMinute !== undefined ? subOffMinute : 90 + stoppage
    : 0;

  // --- team result -------------------------------------------------------
  const yourQuality = weightedAbility(you.attributes, you.position);
  const boost = plays ? clamp((yourQuality - us.strength) * 0.04, -1.5, 2.5) * (minutes / 90) : 0;
  const ourLambda = expectedGoals(us.strength + (homeSide ? 3 : 0) + boost, them.strength);
  const theirLambda = expectedGoals(them.strength + (homeSide ? 0 : 3), us.strength);
  let ourGoals = poisson(rng, ourLambda);
  let theirGoals = poisson(rng, theirLambda);

  // --- your contribution (inside your window only) -----------------------
  let goals = 0;
  let assists = 0;
  const positives: number[] = [];   // minutes of good involvement beats
  const negatives: number[] = [];
  if (plays) {
    const share = (windowEnd - windowStart) / 90;
    const chanceRate = you.position === 'ST' ? 2.2 : you.position === 'CM' ? 1.2 : 0.5;
    const involveRate = you.position === 'CB' ? 2.2 : 1.6;
    const formFactor = clamp(you.form / 6.0, 0.75, 1.3);
    const chances = poisson(rng, chanceRate * share * formFactor);
    const convertSkill = (you.attributes.finishing * 0.7 + you.attributes.composure * 0.3) / 20;
    for (let i = 0; i < chances; i++) {
      if (rng() < convertSkill * 0.55 && goals < ourGoals + 1) goals++;
      else positives.push(0); // a chance, not taken cleanly — still involvement
    }
    goals = Math.min(goals, Math.max(ourGoals, goals > 0 ? 1 : 0));
    if (goals > ourGoals) ourGoals = goals; // your late winner can BE the team's goal
    const assistSkill = (you.attributes.passing * 0.7 + you.attributes.control * 0.3) / 20;
    const maxAssists = Math.max(0, ourGoals - goals);
    assists = Math.min(poisson(rng, (you.position === 'CM' ? 0.9 : 0.4) * share * assistSkill), maxAssists);
    const inv = poisson(rng, involveRate * share);
    for (let i = 0; i < inv; i++) positives.push(0);
    const errRate = clamp(0.5 - (you.attributes.composure + you.attributes.positioning) / 80, 0.08, 0.5);
    const errs = poisson(rng, errRate * share);
    for (let i = 0; i < errs; i++) negatives.push(0);
  }

  // --- decision moment ----------------------------------------------------
  let decision: MatchResult['decision'];
  let decisionBeatMinute: number | undefined;
  const decisionTriggers = plays && rng() < MATCH.decisionChance;
  if (decisionTriggers) {
    decisionBeatMinute = rint(rng, Math.max(windowStart + 5, 15), Math.max(windowEnd - 3, windowStart + 6));
    const def = DECISIONS[you.position];
    if (p.decisionChoice === undefined) {
      return { kind: 'needs-decision', decision: def, minute: decisionBeatMinute };
    }
    const dRng = mulberry32(childSeed(state.seed, `decision:${state.absoluteWeek}`));
    decision = resolveDecision(def, p.decisionChoice, you, dRng);
    if (decision.success && p.decisionChoice === 0 && (you.position === 'ST' || you.position === 'CM')) {
      goals++;
      ourGoals++;
    }
  }

  // --- beats, ordered by minute -------------------------------------------
  const beats: MatchBeat[] = [];
  const usName = us.name;
  beats.push({ minute: 0, kind: 'kickoff', text: `Kick-off. ${usName} vs ${opponentName}.` });
  if (subOnMinute !== undefined) {
    beats.push({
      minute: subOnMinute, kind: 'sub_on', hardStop: true,
      text: isDebut
        ? `${subOnMinute}' — THIS IS IT. The board goes up. Your professional debut.`
        : `${subOnMinute}' — you're on. The coach sends you into the fight.`,
    });
  } else if (plays && isDebut) {
    beats.push({ minute: 0, kind: 'sub_on', hardStop: true, text: 'You walk out with the starting XI. Your professional debut, from the first whistle.' });
  }

  // distribute goals across minutes (yours inside your window)
  const usedMinutes = new Set<number>();
  const takeMinute = (lo: number, hi: number): number => {
    for (let tries = 0; tries < 20; tries++) {
      const m = rint(rng, lo, hi);
      if (!usedMinutes.has(m)) { usedMinutes.add(m); return m; }
    }
    return rint(rng, lo, hi);
  };
  for (let g = 0; g < goals; g++) {
    const m = takeMinute(Math.max(windowStart + 1, 1), Math.max(windowEnd - 1, windowStart + 2));
    beats.push({ minute: m, kind: 'your_goal', text: `${m}' — GOAL! You score for ${usName}!`, ratingDelta: 1.1 });
  }
  for (let a = 0; a < assists; a++) {
    const m = takeMinute(Math.max(windowStart + 1, 1), Math.max(windowEnd - 1, windowStart + 2));
    beats.push({ minute: m, kind: 'your_assist', text: `${m}' — your pass splits them open — assist!`, ratingDelta: 0.7 });
  }
  for (let g = 0; g < ourGoals - goals - assists; g++) {
    const m = takeMinute(1, 90);
    beats.push({ minute: m, kind: 'team_goal', text: `${m}' — ${usName} score!`, });
  }
  for (let g = 0; g < theirGoals; g++) {
    const m = takeMinute(1, 90);
    beats.push({ minute: m, kind: 'opp_goal', text: `${m}' — ${opponentName} strike back.` });
  }
  for (const _ of positives) {
    const m = takeMinute(Math.max(windowStart + 1, 1), Math.max(windowEnd - 1, windowStart + 2));
    beats.push({
      minute: m, kind: you.position === 'CB' ? 'tackle' : 'key_pass',
      text: you.position === 'CB' ? `${m}' — you read it and win the ball cleanly.` : `${m}' — sharp involvement; the move flows through you.`,
      ratingDelta: 0.15,
    });
  }
  for (const _ of negatives) {
    const m = takeMinute(Math.max(windowStart + 1, 1), Math.max(windowEnd - 1, windowStart + 2));
    beats.push({ minute: m, kind: 'error', text: `${m}' — a loose touch — they nearly punish it.`, ratingDelta: -0.5 });
  }
  if (decision && decisionBeatMinute !== undefined) {
    beats.push({ minute: decisionBeatMinute, kind: 'decision', text: `${decisionBeatMinute}' — ${decision.text}`, ratingDelta: decision.success ? 0.6 : -0.6 });
  }
  if (subOffMinute !== undefined && plays) {
    beats.push({ minute: subOffMinute, kind: 'sub_off', text: `${subOffMinute}' — your number is up. You come off to handshakes.` });
  }
  beats.push({ minute: 90 + stoppage, kind: 'fulltime', text: `Full time.` });

  const rank: Record<string, number> = { kickoff: 0, sub_on: 1, decision: 2, your_goal: 3, your_assist: 3, team_goal: 3, opp_goal: 3, key_pass: 4, tackle: 4, error: 4, chance: 4, save_context: 4, injury: 5, sub_off: 6, fulltime: 7 };
  beats.sort((a, b) => a.minute - b.minute || rank[a.kind] - rank[b.kind]);

  // --- rating (derived from what happened) ---------------------------------
  let rating: number | null = null;
  if (plays) {
    let r = MATCH.baseRating
      + (yourQuality - them.strength) * 0.015
      + readinessRatingMod(you.readiness)
      + (you.form - 6) * 0.1
      + gauss(rng) * MATCH.varianceSd;
    for (const b of beats) r += b.ratingDelta ?? 0;
    rating = clamp(Math.round(r * 10) / 10, 3, 10);
  }

  // commit the fixture score
  fixture.homeGoals = homeSide ? ourGoals : theirGoals;
  fixture.awayGoals = homeSide ? theirGoals : ourGoals;
  fixture.played = true;

  return {
    kind: 'result',
    result: {
      fixture,
      involvement: plays ? (subOnMinute !== undefined ? 'sub' : 'start') : involvement === 'sub' ? 'bench' : 'out',
      minutes: Math.max(0, Math.round(minutes)),
      subOnMinute, subOffMinute,
      rating, goals, assists, beats,
      decision,
      selectionReason,
      usLabel: p.usName,
      oppLabel: opponentName,
    },
  };
}

function resolveDecision(def: MatchDecisionDef, choice: number, you: CareerState['you'], rng: Rng): NonNullable<MatchResult['decision']> {
  if (choice !== 0) {
    return { def, choiceIndex: choice, success: true, text: defSafeText(def.id) };
  }
  let p = 0.5;
  if (def.id === 'dec_penalty') p = clamp((you.attributes.finishing * 0.6 + you.attributes.composure * 0.4) / 20 * 0.9, 0.3, 0.9);
  if (def.id === 'dec_late_shot') p = clamp((you.attributes.finishing * 0.5 + you.attributes.control * 0.5) / 20 * 0.55, 0.12, 0.5);
  if (def.id === 'dec_last_tackle') p = clamp((you.attributes.positioning * 0.5 + you.attributes.strength * 0.5) / 20 * 0.95, 0.35, 0.92);
  const success = rng() < p;
  const texts: Record<string, [string, string]> = {
    dec_penalty: ['You bury it. Ice in the veins.', 'Saved! The keeper guessed right — the moment slips away.'],
    dec_late_shot: ['It flies in off the far post! An outrageous strike.', 'It sails over. Groans behind the goal.'],
    dec_last_tackle: ['A perfect, clean challenge — you win everything.', 'Mistimed! You’re beaten and booked; hearts in mouths.'],
  };
  return { def, choiceIndex: 0, success, text: texts[def.id][success ? 0 : 1] };
}

function defSafeText(id: string): string {
  const texts: Record<string, string> = {
    dec_penalty: 'You hand the ball to the senior man. He scores; the armband nods your way.',
    dec_late_shot: 'You keep it simple and keep the ball. The coach approves.',
    dec_last_tackle: 'You stay big, slow him down, and the danger passes.',
  };
  return texts[id];
}
