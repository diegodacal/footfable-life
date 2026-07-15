// The off-pitch week: meter drift + coupling (single writer, always with a
// Reason), the derived Character, the QUIET event competition, the economy
// ledger. LIFE_SYSTEM.md + PERSONAL_LIFE_TAB.md, reconciled.
import type {
  CareerState, CareerStage, EventEffects, FiredEvent, LifeEventDef, LifeWeek,
  MatchResult, MeterId, MeterMove, Reason, TallyId,
} from '../types/core';
import { LIFE, type CharacterBand } from '../data/lifeConfig';
import { ECONOMY } from '../data/constants';
import { EVENTS } from '../data/events';
import { childSeed, clamp, mulberry32, weightedPick } from '../rng';
import { statusAtLeast } from './status';
import { reason, up, down, flat } from './reason';

// ---------------------------------------------------------------------------
// Meters — the single writer
// ---------------------------------------------------------------------------

export function moveMeter(state: CareerState, moves: MeterMove[], meter: MeterId, delta: number, why: Reason): void {
  if (Math.abs(delta) < 0.05) return;
  const before = state.you.meters[meter];
  state.you.meters[meter] = clamp(before + delta, 0, 100);
  const actual = state.you.meters[meter] - before;
  if (Math.abs(actual) >= 0.05) moves.push({ meter, delta: Math.round(actual * 10) / 10, reason: why });
}

export function deriveCharacter(state: CareerState): { value: number; band: CharacterBand } {
  const w = LIFE.character.weights;
  const posFlags = LIFE.character.historyFlagsPositive.filter((f) => f in state.flags).length;
  const negFlags = LIFE.character.historyFlagsNegative.filter((f) => f in state.flags).length;
  const history = clamp(50 + (posFlags - negFlags) * 12, 0, 100);
  const value =
    state.you.meters.reputation * w.reputation +
    state.you.meters.professionalism * w.professionalism +
    history * w.history;
  const band: CharacterBand =
    value >= LIFE.character.bands.modelPro ? 'ModelPro' :
    value >= LIFE.character.bands.grounded ? 'Grounded' : 'LooseCannon';
  return { value: Math.round(value), band };
}

export function careerStage(state: CareerState): CareerStage {
  const age = state.you.age;
  if (state.endedReason) return 'post';
  if (state.phase === 'prologue' || age <= 17) return 'youth';
  if (age <= 21) return 'break';
  if (age <= 29) return 'prime';
  if (age <= 32) return 'vet';
  return 'twilight';
}

// ---------------------------------------------------------------------------
// Phase A (pre-match): the QUIET event competition. Deterministic per week,
// so an interrupt can pause the week and replay identically once answered.
// ---------------------------------------------------------------------------

export function rollLifeEvent(
  state: CareerState,
  interruptChoice: number | undefined,
): { fired: FiredEvent | null; needsInterrupt: { event: LifeEventDef; reason: Reason } | null; moves: MeterMove[] } {
  const moves: MeterMove[] = [];
  const rng = mulberry32(childSeed(state.seed, `life:${state.absoluteWeek}`));
  let fired: FiredEvent | null = null;
  const eligible = eligibleEvents(state);
  if (eligible.length > 0) {
    const weights = eligible.map((e) => e.weight);
    const pickPool: Array<{ def: LifeEventDef | null }> = [...eligible.map((e) => ({ def: e.def })), { def: null }];
    const picked = weightedPick(rng, pickPool, [...weights, LIFE.scheduler.quietWeight]);
    if (picked.def) {
      const why = fireReason(state, picked.def);
      if (picked.def.interrupt && interruptChoice === undefined) {
        return { fired: null, needsInterrupt: { event: picked.def, reason: why }, moves };
      }
      fired = {
        eventId: picked.def.id, week: state.week, season: state.season,
        resolved: picked.def.interrupt ?? false,
        choiceIndex: picked.def.interrupt ? interruptChoice : undefined,
        reason: why,
      };
      state.cooldowns[picked.def.id] = state.absoluteWeek + (picked.def.cooldownWeeks ?? 6);
      state.seasonFired[picked.def.id] = (state.seasonFired[picked.def.id] ?? 0) + 1;
      if (picked.def.interrupt) {
        applyEventChoice(state, moves, picked.def, interruptChoice!);
        state.eventLog.push(fired);
      } else {
        state.inbox.push(fired);
      }
    }
  }
  return { fired, needsInterrupt: null, moves };
}

// ---------------------------------------------------------------------------
// Phase B (post-match): drift, coupling, match-driven morale, the ledger.
// ---------------------------------------------------------------------------

export function runMetersEconomy(
  state: CareerState,
  match: MatchResult | null,
): { moves: MeterMove[]; ledger: LifeWeek['ledger'] } {
  const moves: MeterMove[] = [];

  // 1) drift toward baseline
  for (const meter of Object.keys(LIFE.drift.baseline) as MeterId[]) {
    if (meter === 'finances') continue; // finances drifts toward the economy target below
    const target = LIFE.drift.baseline[meter];
    const gap = target - state.you.meters[meter];
    if (Math.abs(gap) > 2) {
      moveMeter(state, moves, meter, gap * LIFE.drift.rate,
        reason('Life settles back toward its baseline.', [flat('quiet weeks pull every meter toward normal')]));
    }
  }

  // 2) coupling web
  const c = LIFE.coupling;
  const ls = state.you.meters.lifestyle;
  if (ls > 50) {
    moveMeter(state, moves, 'professionalism', -(ls - 50) * c.lifestyleErodesProfessionalism,
      reason('The nightlife is eroding your discipline.', [down('a heavy lifestyle wears at professionalism', 2)]));
  }
  const fam = state.you.meters.family;
  if (fam > 60 && state.you.meters.morale < 55) {
    moveMeter(state, moves, 'morale', (fam - 60) * c.familyBuffersMorale,
      reason('The people around you hold you steady.', [up('a stable family buffers morale', 2)]));
  }

  // 3) match-driven morale
  if (match) {
    const won = matchWon(state, match);
    if (match.involvement === 'start' || match.involvement === 'sub') {
      moveMeter(state, moves, 'morale', c.startMoraleBoost + (won === true ? c.winMoraleBoost : won === false ? -c.lossMoraleHit : 0) + match.goals * c.goalMoraleBoost,
        reason(won === true ? 'Playing and winning — this is why you do it.' : won === false ? 'You played, but the defeat stings.' : 'Minutes in the legs, a point shared.', [
          up('real minutes played', 1),
          ...(match.goals > 0 ? [up('you scored', 2)] : []),
          ...(won === false ? [down('the result went against you', 1)] : []),
        ]));
      if (match.rating !== null && match.rating >= 7.5) {
        moveMeter(state, moves, 'reputation', 2,
          reason('A standout performance gets noticed.', [up(`rated ${match.rating.toFixed(1)} this week`, 2)]));
      }
    } else if (match.involvement === 'bench' || match.involvement === 'out') {
      moveMeter(state, moves, 'morale', -c.benchedMoraleHit,
        reason('Watching from the sidelines eats at you.', [down('no minutes this week', 2)]));
    }
  }

  // 4) economy ledger
  const wage = state.phase === 'prologue' ? 1 : state.you.weeklyWage;
  const upkeep = ECONOMY.upkeepBase + state.you.meters.lifestyle * ECONOMY.upkeepLifestyleSlope;
  const net = wage - upkeep;
  state.you.cash = Math.round((state.you.cash + net) * 10) / 10;
  const finTarget = clamp(30 + state.you.cash / 8, 5, 95);
  const finGap = finTarget - state.you.meters.finances;
  if (Math.abs(finGap) > 1) {
    moveMeter(state, moves, 'finances', finGap * 0.12,
      reason(state.you.cash < 0 ? 'The balance is in the red.' : 'Your balance shapes your security.', [
        state.you.cash < 0 ? down('spending beyond your means', 2) : up(`wage ${wage} vs upkeep ${upkeep.toFixed(1)}`, 1),
      ]));
  }
  if (state.you.cash < 0) {
    moveMeter(state, moves, 'morale', -ECONOMY.debtMoraleHit,
      reason('Debt is a weight you carry into training.', [down('the balance is negative — this will keep hurting until it is fixed', 2)]));
  }

  return { moves, ledger: { wage, upkeep: Math.round(upkeep * 10) / 10, net: Math.round(net * 10) / 10 } };
}

function matchWon(state: CareerState, match: MatchResult): boolean | null {
  const fx = match.fixture;
  const home = fx.homeId === state.clubId;
  const ours = home ? fx.homeGoals : fx.awayGoals;
  const theirs = home ? fx.awayGoals : fx.homeGoals;
  return ours > theirs ? true : ours < theirs ? false : null;
}

// ---------------------------------------------------------------------------
// Event eligibility & weighting
// ---------------------------------------------------------------------------

function eligibleEvents(state: CareerState): Array<{ def: LifeEventDef; weight: number }> {
  const stage = careerStage(state);
  const { band } = deriveCharacter(state);
  const out: Array<{ def: LifeEventDef; weight: number }> = [];
  const kind = state.calendar.weeks[state.week - 1];
  const matchThisWeek = kind === 'league' || kind === 'cup';
  for (const def of EVENTS) {
    if (def.weightBase <= 0) continue; // milestone-triggered only
    if (!def.stages.includes(stage)) continue;
    if ((state.cooldowns[def.id] ?? 0) > state.absoluteWeek) continue;
    if (def.seasonCap && (state.seasonFired[def.id] ?? 0) >= def.seasonCap) continue;
    if (!gatesPass(state, def, matchThisWeek)) continue;
    let w = def.weightBase * LIFE.character.biasMult[def.characterBias][band];
    const curve = LIFE.scheduler.scaleCurve;
    for (const m of def.scalesWith ?? []) w *= curve.min + (curve.max - curve.min) * (state.you.meters[m] / 100);
    for (const m of def.scalesInverse ?? []) w *= curve.min + (curve.max - curve.min) * ((100 - state.you.meters[m]) / 100);
    for (const [flag, mult] of Object.entries(def.flagWeightMods ?? {})) if (flag in state.flags) w *= mult;
    if (w > 0.01) out.push({ def, weight: w });
  }
  return out;
}

function gatesPass(state: CareerState, def: LifeEventDef, matchThisWeek: boolean): boolean {
  const g = def.gates;
  if (!g) return true;
  const { you } = state;
  for (const [m, v] of Object.entries(g.minMeter ?? {})) if (you.meters[m as MeterId] < v) return false;
  for (const [m, v] of Object.entries(g.maxMeter ?? {})) if (you.meters[m as MeterId] > v) return false;
  for (const f of g.requiresFlag ?? []) if (!(f in state.flags)) return false;
  for (const f of g.forbidsFlag ?? []) if (f in state.flags) return false;
  for (const [t, v] of Object.entries(g.tallyAtLeast ?? {})) if ((state.tallies[t as TallyId] ?? 0) < (v as number)) return false;
  if (g.minStatus && !statusAtLeast(you.status, g.minStatus)) return false;
  if (g.matchWithinDays !== undefined && !matchThisWeek) return false;
  if (g.minAge !== undefined && you.age < g.minAge) return false;
  if (g.maxAge !== undefined && you.age > g.maxAge) return false;
  if (g.familyExpectation && you.profile.familyExpectation !== g.familyExpectation) return false;
  if (g.faith && you.profile.faith !== g.faith) return false;
  return true;
}

function fireReason(state: CareerState, def: LifeEventDef): Reason {
  const factors = [];
  const { band } = deriveCharacter(state);
  if (def.characterBias === 'low' && band === 'LooseCannon') factors.push(down('your reputation attracts this kind of thing', 2));
  if (def.characterBias === 'high' && band === 'ModelPro') factors.push(up('your character opens doors like this', 2));
  for (const m of def.scalesWith ?? []) factors.push(up(`high ${m} makes this likelier`, 1));
  for (const m of def.scalesInverse ?? []) factors.push(down(`low ${m} makes this likelier`, 1));
  if (factors.length === 0) factors.push(flat('part of a footballer’s life'));
  return reason('Why this, why now:', factors);
}

// ---------------------------------------------------------------------------
// Applying a choice (shared by interrupts, inbox resolutions, milestones)
// ---------------------------------------------------------------------------

export function applyEventChoice(state: CareerState, moves: MeterMove[], def: LifeEventDef, choiceIndex: number): void {
  const choice = def.choices[clamp(choiceIndex, 0, def.choices.length - 1)];
  const fx: EventEffects = choice.effects;
  const why = reason(`${def.title}: ${choice.label}.`, [flat(fx.reasonText)]);
  for (const [m, delta] of Object.entries(fx.meters ?? {})) {
    moveMeter(state, moves, m as MeterId, delta as number, why);
  }
  if (fx.readiness) state.you.readiness = clamp(state.you.readiness + fx.readiness, 0, 100);
  if (fx.standing) state.you.standing = clamp(state.you.standing + fx.standing, 0, 100);
  if (fx.cash) state.you.cash = Math.round((state.you.cash + fx.cash) * 10) / 10;
  for (const flag of fx.flags ?? []) state.flags[flag] = state.absoluteWeek;
  for (const [tally, inc] of Object.entries(fx.tally ?? {})) {
    state.tallies[tally as TallyId] = (state.tallies[tally as TallyId] ?? 0) + (inc as number);
  }
  // tally -> status flag thresholds (chains arm here; payoffs land in M2)
  for (const [tally, cfg] of Object.entries(LIFE.tallyThresholds)) {
    const t = tally as TallyId;
    if ((state.tallies[t] ?? 0) >= cfg.threshold && !(cfg.flag in state.flags)) {
      const forbid = 'forbidsFlag' in cfg ? (cfg as { forbidsFlag?: string }).forbidsFlag : undefined;
      if (!forbid || !(forbid in state.flags)) state.flags[cfg.flag] = state.absoluteWeek;
    }
  }
}
