// Anti-FOMO / determinism invariants. These land BEFORE any system code and
// stay green forever. See docs/DESIGN_DECISIONS.md §3.6.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { mulberry32, childSeed, weightedPick } from './rng';

const ENGINE_DIR = join(__dirname);

function engineSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...engineSourceFiles(p));
    else if (p.endsWith('.ts') && !p.endsWith('.test.ts')) out.push(p);
  }
  return out;
}

describe('anti-FOMO invariants', () => {
  it('the engine never reads a wall clock or ambient randomness', () => {
    const banned = [/Date\.now/, /new Date\(/, /Math\.random/, /performance\.now/, /setTimeout|setInterval/];
    for (const file of engineSourceFiles(ENGINE_DIR)) {
      const src = readFileSync(file, 'utf8');
      for (const pattern of banned) {
        expect(pattern.test(src), `${file} must not match ${pattern}`).toBe(false);
      }
    }
  });

  it('the engine never touches the DOM or browser APIs', () => {
    const banned = [/\bdocument\./, /\bwindow\./, /localStorage/, /navigator\./, /from ['"]react/];
    for (const file of engineSourceFiles(ENGINE_DIR)) {
      const src = readFileSync(file, 'utf8');
      for (const pattern of banned) {
        expect(pattern.test(src), `${file} must not match ${pattern}`).toBe(false);
      }
    }
  });
});

describe('deterministic RNG', () => {
  it('same seed → same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) expect(a()).toBe(b());
  });

  it('child seeds are stable across runs', () => {
    expect(childSeed(42, 'world')).toBe(childSeed(42, 'world'));
    expect(childSeed(42, 'world')).not.toBe(childSeed(42, 'match'));
  });

  it('weightedPick respects zero weights', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      expect(weightedPick(rng, ['a', 'b'], [0, 1])).toBe('b');
    }
  });
});
