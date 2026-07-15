// Position-weight maps for match performance and selection (PROTOTYPE_SPEC §4).
import type { AttributeId, Attributes, Position } from '../types/core';

export const POSITION_WEIGHTS: Record<Position, Record<AttributeId, number>> = {
  ST: { finishing: 1.0, pace: 0.9, composure: 0.9, control: 0.6, passing: 0.5, strength: 0.6, positioning: 0.5, stamina: 0.4 },
  CM: { passing: 1.0, stamina: 0.9, composure: 0.9, control: 0.7, positioning: 0.7, finishing: 0.4, pace: 0.5, strength: 0.5 },
  CB: { strength: 1.0, positioning: 1.0, pace: 0.8, composure: 0.7, stamina: 0.5, passing: 0.4, control: 0.3, finishing: 0.1 },
};

export const POSITION_LABEL: Record<Position, string> = {
  ST: 'Striker', CM: 'Central Midfielder', CB: 'Centre-back',
};

/** Weighted ability 0–100 for a full attribute set (1–20 scale in, 0–100 out). */
export function weightedAbility(attrs: Attributes, position: Position): number {
  const w = POSITION_WEIGHTS[position];
  let sum = 0;
  let wsum = 0;
  for (const key of Object.keys(w) as AttributeId[]) {
    sum += attrs[key] * w[key];
    wsum += w[key];
  }
  return (sum / wsum) * 5; // 1–20 -> 5–100
}
