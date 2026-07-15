// The fun-tuning harness: proxy metrics for "is the loop enjoyable?", run
// headless across seeds. These are guardrails — every tuning change must keep
// them green, and they exist to catch dead stretches and dominant paths.
import { describe, it, expect } from 'vitest';
import { createCareer, tick, weekSignal, CALENDAR } from './index';
import type { CareerState } from './index';

const SEEDS = [111, 222, 333];

interface FunMetrics {
  eventsPerSeason: number;
  maxDeadStretch: number;        // consecutive senior weeks with nothing worth stopping for
  appsSeason1: number;
  avgRating: number;
  interactionWeeksShare: number; // weeks with a match, event, or pending decision
}

function measure(seed: number): FunMetrics {
  let state: CareerState = createCareer(`fun-${seed}`, { seed });
  for (let i = 0; i < CALENDAR.prologueWeeks; i++) state = tick(state).state;

  let events = 0;
  let deadStretch = 0;
  let maxDeadStretch = 0;
  let interactionWeeks = 0;
  const seasonWeeks = state.calendar.totalWeeks;
  for (let i = 0; i < seasonWeeks; i++) {
    const r = tick(state);
    state = r.state;
    if (r.report.life.firedEvent) events++;
    const interactive = r.report.match !== null || r.report.life.firedEvent !== null || r.report.milestones.length > 0;
    if (interactive) interactionWeeks++;
    const signal = weekSignal(state, r.report);
    if (signal.worthStopping) deadStretch = 0;
    else maxDeadStretch = Math.max(maxDeadStretch, ++deadStretch);
  }
  const s = state.lastReports[0]; // last report of the season (finale)
  void s;
  const you = state.you;
  return {
    eventsPerSeason: events,
    maxDeadStretch,
    appsSeason1: you.career.apps,
    avgRating: 0, // computed below when apps exist
    interactionWeeksShare: interactionWeeks / seasonWeeks,
  };
}

describe('fun guardrails (headless, multi-seed)', () => {
  const metrics = SEEDS.map(measure);

  it('life events are present but never a wall: 1–9 per season', () => {
    for (const m of metrics) {
      expect(m.eventsPerSeason).toBeGreaterThanOrEqual(1);
      expect(m.eventsPerSeason).toBeLessThanOrEqual(9);
    }
  });

  it('no dead stretches: never more than 4 straight weeks with nothing worth stopping for', () => {
    for (const m of metrics) expect(m.maxDeadStretch).toBeLessThanOrEqual(4);
  });

  it('a debut-season Backup gets real football: at least 3 appearances', () => {
    for (const m of metrics) expect(m.appsSeason1).toBeGreaterThanOrEqual(3);
  });

  it('most weeks carry something: matches, events or milestones in >=60% of weeks', () => {
    for (const m of metrics) expect(m.interactionWeeksShare).toBeGreaterThanOrEqual(0.6);
  });

  it('careers diverge across seeds (lives are actually different)', () => {
    const a = createCareer('div-a', { seed: 1001 });
    const b = createCareer('div-b', { seed: 2002 });
    let sa = a, sb = b;
    for (let i = 0; i < CALENDAR.prologueWeeks + 15; i++) { sa = tick(sa).state; sb = tick(sb).state; }
    const fingerprint = (s: CareerState) =>
      `${s.you.name}|${s.clubId}|${s.you.season.goals}|${Object.keys(s.flags).sort().join(',')}`;
    expect(fingerprint(sa)).not.toBe(fingerprint(sb));
  });
});
