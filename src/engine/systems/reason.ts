// The "why" contract helpers. Every meaningful outcome carries a Reason,
// built AT the point of decision, rendered as plain language.
import type { Reason, ReasonFactor } from '../types/core';

export function reason(headline: string, factors: ReasonFactor[] = []): Reason {
  return { headline, factors };
}

export function up(label: string, weight = 1): ReasonFactor {
  return { label, dir: 'up', weight };
}

export function down(label: string, weight = 1): ReasonFactor {
  return { label, dir: 'down', weight };
}

export function flat(label: string): ReasonFactor {
  return { label, dir: 'flat' };
}

/** Render a Reason as a single plain-language line. */
export function describeReason(r: Reason): string {
  if (r.factors.length === 0) return r.headline;
  const parts = [...r.factors]
    .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))
    .map((f) => (f.dir === 'up' ? `+ ${f.label}` : f.dir === 'down' ? `− ${f.label}` : f.label));
  return `${r.headline} (${parts.join('; ')})`;
}
