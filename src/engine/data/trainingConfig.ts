// TRAINING_SYSTEM.md §10 — every training tunable, no magic numbers in code.
import type { AttributeId, Block, Intensity } from '../types/core';

export const ATTRIBUTE_BLOCKS: Record<AttributeId, Block> = {
  finishing: 'technical', passing: 'technical', control: 'technical',
  pace: 'physical', strength: 'physical', stamina: 'physical',
  composure: 'mental', positioning: 'mental',
};

export const ATTRIBUTE_LABEL: Record<AttributeId, string> = {
  finishing: 'Finishing', passing: 'Passing', control: 'Control',
  pace: 'Pace', strength: 'Strength', stamina: 'Stamina',
  composure: 'Composure', positioning: 'Positioning',
};

export const BLOCK_LABEL: Record<Block, string> = {
  technical: 'Technical', physical: 'Physical', mental: 'Mental',
};

export const TRAINING = {
  intensity: {
    intensive: { trainingCost: 22, gMult: 1.0, injuryMult: 1.6, recoverBonus: 0 },
    balanced: { trainingCost: 10, gMult: 0.6, injuryMult: 1.0, recoverBonus: 0 },
    recover: { trainingCost: 0, gMult: 0.15, injuryMult: 0.7, recoverBonus: 12 },
  } as Record<Intensity, { trainingCost: number; gMult: number; injuryMult: number; recoverBonus: number }>,
  focusWeight: { primary: 0.7, secondary: 0.3, maintenance: 0.1 },
  readiness: {
    start: 70,
    seasonReset: 80,
    recoveryBase: 14,
    matchCostPer90: 20,
    bands: { peak: 80, fresh: 50, tired: 30 },
    ratingMod: { peakBonus: 0.3, tiredPenalty: -0.8, depletedPenalty: -1.8 },
  },
  injury: { base: 0.015, slope: 0.004, threshold: 40, minWeeks: 1, maxWeeks: 4 },
  agePhase: {
    youth: { maxAge: 21, technical: 1.3, physical: 1.3, mental: 1.0 },
    prime: { maxAge: 29, technical: 1.0, physical: 0.7, mental: 1.1 },
    decline: { maxAge: 999, technical: 0.6, physical: -0.4, mental: 1.0 },
  },
  growth: {
    baseGain: 0.09,
    matchBase: 0.05,             // per 90 minutes, position-weighted attrs
    drScale: 4,                  // (potential-current)/drScale, on the 1–20 scale
    drFloor: 0.05,
    declineOffsetStrength: 1.0,
    declineOffsetCap: 0.85,
    naturalDecayPhysical: 0.06,  // weekly, in decline phase
  },
  coachRequest: {
    cooldownWeeks: 5,
    seasonCap: 4,
    standingBonus: 8,
    standingPenalty: 5,
    windowWeeks: 3,
    triggerChance: 0.35,
  },
} as const;

export type AgePhaseName = 'youth' | 'prime' | 'decline';

export function agePhase(age: number): AgePhaseName {
  if (age <= TRAINING.agePhase.youth.maxAge) return 'youth';
  if (age <= TRAINING.agePhase.prime.maxAge) return 'prime';
  return 'decline';
}
