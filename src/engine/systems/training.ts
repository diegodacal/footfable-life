// Training & development: readiness, growth with age phases + diminishing
// returns, decline-as-decay-offset, the §9 "why" readout. TRAINING_SYSTEM.md.
import type { AttributeId, CareerState, TrainingReadout, Reason } from '../types/core';
import { ATTRIBUTE_BLOCKS, ATTRIBUTE_LABEL, BLOCK_LABEL, TRAINING, agePhase } from '../data/trainingConfig';
import { clamp } from '../rng';
import { reason, up, down, flat } from './reason';

export type ReadinessBand = 'PEAK' | 'FRESH' | 'TIRED' | 'DEPLETED';

export function readinessBand(r: number): ReadinessBand {
  const b = TRAINING.readiness.bands;
  if (r >= b.peak) return 'PEAK';
  if (r >= b.fresh) return 'FRESH';
  if (r >= b.tired) return 'TIRED';
  return 'DEPLETED';
}

export function readinessRatingMod(r: number): number {
  const band = readinessBand(r);
  const m = TRAINING.readiness.ratingMod;
  return band === 'PEAK' ? m.peakBonus : band === 'FRESH' ? 0 : band === 'TIRED' ? m.tiredPenalty : m.depletedPenalty;
}

/** Resolve a week of training: mutates attributes + readiness, returns the readout. */
export function resolveTraining(state: CareerState, minutesLastWeek: number): TrainingReadout {
  const { you, training } = state;
  const cfg = TRAINING;
  const intensity = cfg.intensity[training.intensity];
  const phase = agePhase(you.age);
  const phaseCfg = cfg.agePhase[phase];

  // readiness update (injured players rest instead)
  const injured = you.injuryWeeks > 0;
  const trainingCost = injured ? 0 : intensity.trainingCost;
  const matchCost = (minutesLastWeek / 90) * cfg.readiness.matchCostPer90;
  const before = you.readiness;
  you.readiness = clamp(
    you.readiness + cfg.readiness.recoveryBase + (injured ? 6 : intensity.recoverBonus) - trainingCost - matchCost,
    0, 100,
  );

  const lines: string[] = [];
  const factors = [];
  if (!injured) {
    for (const attr of Object.keys(you.attributes) as AttributeId[]) {
      const block = ATTRIBUTE_BLOCKS[attr];
      const focusWeight =
        block === training.primary ? cfg.focusWeight.primary :
        block === training.secondary ? cfg.focusWeight.secondary : cfg.focusWeight.maintenance;
      const phaseMult = phaseCfg[block];
      const headroom = clamp((you.potential[attr] - you.attributes[attr]) / cfg.growth.drScale, cfg.growth.drFloor, 1);

      let delta: number;
      if (phaseMult >= 0) {
        delta = cfg.growth.baseGain * intensity.gMult * focusWeight * phaseMult * headroom;
      } else {
        // decline: natural decay that training only offsets, never reverses (§0.5)
        const decay = cfg.growth.naturalDecayPhysical;
        const offset = Math.min(
          cfg.growth.declineOffsetCap,
          intensity.gMult * focusWeight * cfg.growth.declineOffsetStrength,
        );
        delta = -decay * (1 - offset);
      }
      if (Math.abs(delta) < 0.005) {
        if (headroom <= cfg.growth.drFloor && focusWeight >= cfg.focusWeight.secondary) {
          lines.push(`${ATTRIBUTE_LABEL[attr]} +0.0 — near your potential; further work yields little.`);
        }
        continue;
      }
      you.attributes[attr] = clamp(you.attributes[attr] + delta, 1, 20);
      if (focusWeight >= cfg.focusWeight.secondary || delta < 0) {
        const why =
          delta < 0 ? 'age is working against you here; training only slows the drop' :
          `${training.intensity}, ${block === training.primary ? 'primary' : 'secondary'} focus${headroom < 0.3 ? ', nearing your ceiling' : ''}`;
        lines.push(`${ATTRIBUTE_LABEL[attr]} ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} — ${why}.`);
      }
    }
    factors.push(up(`${BLOCK_LABEL[training.primary]} primary focus`, 2));
    factors.push(up(`${BLOCK_LABEL[training.secondary]} secondary`, 1));
    factors.push(training.intensity === 'intensive' ? down('intensive week cost readiness', 1) : flat(`${training.intensity} intensity`));
  } else {
    lines.push('Injured — no training this week; the physios run recovery instead.');
    factors.push(down('injury blocks training', 2));
  }

  const band = readinessBand(you.readiness);
  const bandText =
    band === 'PEAK' ? 'sharp — a small rating edge' :
    band === 'FRESH' ? 'fresh — no penalty' :
    band === 'TIRED' ? 'tired — a rating penalty and raised injury risk' :
    'depleted — a heavy rating penalty and real injury danger';
  const readinessLine = `Readiness ${Math.round(you.readiness)} (${band.charAt(0) + band.slice(1).toLowerCase()}) — ${bandText}.`;
  if (you.readiness < before - 15) lines.push('A punishing week — recovery is falling behind the load.');

  return {
    lines,
    readinessLine,
    reason: reason(
      injured ? 'Recovery week under the physios.' : `Trained ${BLOCK_LABEL[training.primary]}/${BLOCK_LABEL[training.secondary]} at ${training.intensity} intensity.`,
      factors,
    ),
  };
}

/** Development from match minutes: position-weighted attributes grow with real football. */
export function applyMatchDevelopment(state: CareerState, minutes: number, oppositionStrength: number): void {
  if (minutes <= 0) return;
  const { you } = state;
  const cfg = TRAINING.growth;
  const phase = agePhase(you.age);
  const oppFactor = clamp(0.7 + oppositionStrength / 150, 0.7, 1.4);
  for (const attr of Object.keys(you.attributes) as AttributeId[]) {
    const block = ATTRIBUTE_BLOCKS[attr];
    const phaseMult = TRAINING.agePhase[phase][block];
    if (phaseMult <= 0) continue;
    const headroom = clamp((you.potential[attr] - you.attributes[attr]) / cfg.drScale, cfg.drFloor, 1);
    const gain = cfg.matchBase * (minutes / 90) * oppFactor * headroom * phaseMult * 0.6;
    you.attributes[attr] = clamp(you.attributes[attr] + gain, 1, 20);
  }
}

export function injuryRoll(state: CareerState, rng: () => number, playedMinutes: number): { weeks: number; reason: Reason } | null {
  const { you, training } = state;
  if (you.injuryWeeks > 0) return null;
  const cfg = TRAINING.injury;
  const intensityMult = TRAINING.intensity[training.intensity].injuryMult;
  const exposure = 0.5 + (playedMinutes / 90) * 0.5;
  const p = (cfg.base + cfg.slope * Math.max(0, cfg.threshold - you.readiness)) * intensityMult * exposure;
  if (rng() < p) {
    const weeks = cfg.minWeeks + Math.floor(rng() * (cfg.maxWeeks - cfg.minWeeks + 1));
    const why = reason('Injury — the body gave way.', [
      you.readiness < cfg.threshold ? down('low readiness raised the risk', 2) : flat('an honest knock'),
      training.intensity === 'intensive' ? down('intensive training load', 1) : flat(`${training.intensity} load`),
    ]);
    return { weeks, reason: why };
  }
  return null;
}
