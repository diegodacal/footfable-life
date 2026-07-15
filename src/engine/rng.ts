// Deterministic PRNG. The engine's ONLY source of randomness.
// Ambient randomness and wall-clock APIs are banned inside src/engine —
// enforced by invariants.test.ts. Time is the week index; chance is the seed.

export type Rng = () => number;

/** mulberry32 — small, fast, good-enough distribution, fully deterministic. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derive a child seed from a parent seed + a label (stable across runs). */
export function childSeed(seed: number, label: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < label.length; i++) {
    h = Math.imul(h ^ label.charCodeAt(i), 2654435761);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick one item, weighted. weights must be >= 0; total > 0. */
export function weightedPick<T>(rng: Rng, items: T[], weights: number[]): T {
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Integer in [min, max] inclusive. */
export function rint(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Approx normal via sum of 3 uniforms, scaled. Mean 0, sd ~1. */
export function gauss(rng: Rng): number {
  return (rng() + rng() + rng() - 1.5) * 1.63;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
