// The Narrator: the presentation system that makes a career FELT.
// Pure engine module reading state and emitting framing as data —
// stakes lines, digests, the Next Beat, the recap, the epithet.
import type { CareerState, NextBeat, WeekReport, WeekSignal } from '../types/core';
import { SIGNALS } from '../data/constants';
import { leagueOf, tablePosition, clubById } from './league';
import { activeAmbitions } from './ambitions';
import { deriveCharacter } from './life';

// ---------------------------------------------------------------------------
// The epithet — "what they say about you"
// ---------------------------------------------------------------------------

export function epithet(state: CareerState): string {
  const t = state.tallies;
  const { band } = deriveCharacter(state);
  if (state.phase === 'prologue') return 'an academy hopeful';
  if ('pro_track' in state.flags) return 'the model professional';
  if ('icon_track' in state.flags) return 'box office';
  if ((t.leader_points ?? 0) >= 2) return 'a voice in the dressing room';
  if ((t.maverick_points ?? 0) >= 2) return 'a wild streak they talk about';
  if ((t.pro_points ?? 0) >= 2) return 'a quiet professional';
  if ((t.family_points ?? 0) >= 2) return 'grounded, family first';
  if (band === 'LooseCannon') return 'trouble waiting for a headline';
  if (state.you.status === 'Star') return 'the name on the back page';
  if (state.you.status === 'Regular') return 'a fixture in the XI';
  return 'a young pro finding his way';
}

// ---------------------------------------------------------------------------
// Stakes — why THIS week matters
// ---------------------------------------------------------------------------

export function stakesLine(state: CareerState): string {
  const kind = state.calendar.weeks[state.week - 1];
  if (state.phase === 'prologue') {
    if (state.week === state.calendar.totalWeeks) return 'Decision day at the academy. Everything you did this season is on the table.';
    if (kind === 'league') return 'A youth fixture — and every one is an audition. The first-team staff read the reports.';
    return 'A training week. The academy notices who does the extra work.';
  }
  if (kind === 'finale') return 'The season closes this week. Verdicts land: the table, your ambitions, your standing.';
  if (kind === 'league') {
    const league = leagueOf(state.world, state.clubId);
    const pos = tablePosition(league, state.clubId);
    const fx = league.fixtures.find((f) => f.week === state.week && !f.played && (f.homeId === state.clubId || f.awayId === state.clubId));
    if (fx) {
      const oppId = fx.homeId === state.clubId ? fx.awayId : fx.homeId;
      const oppPos = tablePosition(league, oppId);
      const opp = clubById(state.world, oppId);
      if (pos <= 2 && oppPos <= 3) return `Top-of-the-table collision with ${opp.name}. Win it and the title race tilts your way.`;
      if (Math.abs(pos - oppPos) <= 2) return `${opp.name} sit ${oppPos === pos ? 'level with you' : oppPos < pos ? 'just above you' : 'just below you'} — a direct fight for position.`;
      if (state.you.readiness < SIGNALS.lowReadinessBeforeMatch) return `Match week against ${opp.name} — and you are running on fumes. The coach will be watching warm-ups.`;
      if (state.you.season.apps === 0) return `Match week against ${opp.name}. You are still waiting for your first senior minutes — impress in training.`;
      return `Match week: ${opp.name}. ${pos <= 4 ? 'Keep the pressure on above you.' : 'Points now buy breathing room later.'}`;
    }
  }
  if (kind === 'rest') {
    if (state.you.readiness < 55) return 'No fixture this week — a gift. Recover properly and come back dangerous.';
    return 'A free week. Push your development while others coast.';
  }
  if (kind === 'preseason') return 'Pre-season. The slate is clean and every place in the XI is winnable.';
  return 'A quiet week in the calendar. They don’t stay quiet long.';
}

// ---------------------------------------------------------------------------
// Next Beat — the single most enticing thing ahead
// ---------------------------------------------------------------------------

export function nextBeat(state: CareerState): NextBeat {
  // a live transfer offer trumps everything — careers turn on these
  if (state.offers.length > 0) {
    const club = clubById(state.world, state.offers[0].clubId);
    const abroad = club.nationId !== state.you.profile.origin;
    return {
      kind: 'window',
      title: `${club.name} are at the door`,
      detail: abroad ? 'A move abroad is on the table. Your country still calls you either way.' : 'A transfer offer awaits your answer before the window shuts.',
    };
  }
  // pending inbox first — a decision is always a beat
  if (state.inbox.length > 0) {
    return { kind: 'event', title: 'Something needs your answer', detail: 'A situation is waiting in your life inbox.', };
  }
  if (state.coachRequest && state.coachRequest.honored === null) {
    return { kind: 'decision', title: 'The coach wants an answer', detail: 'Accept his training focus, or back your own plan.' };
  }
  const amb = activeAmbitions(state)
    .filter((a) => a.active.progress >= SIGNALS.ambitionCloseness)
    .sort((a, b) => b.active.progress - a.active.progress)[0];
  if (amb) {
    return { kind: 'ambition', title: `So close: ${amb.def.title}`, detail: `${Math.round(amb.active.progress * 100)}% there. Finish it.` };
  }
  if (state.phase === 'prologue' && state.week === state.calendar.totalWeeks) {
    return { kind: 'finale', title: 'The call-up decision', detail: 'The academy year ends. The first team is watching.' };
  }
  const kind = state.calendar.weeks[state.week - 1];
  if (kind === 'finale') {
    return { kind: 'finale', title: 'Season finale', detail: 'The table settles, the verdicts land, the story banks a chapter.' };
  }
  // next fixture
  for (let w = state.week; w <= state.calendar.totalWeeks; w++) {
    if (state.calendar.weeks[w - 1] === 'league') {
      if (state.phase === 'prologue') {
        return { kind: 'match', title: w === state.week ? 'Youth fixture this week' : `Youth fixture in week ${w}`, detail: 'Every youth match is an audition for the first team.' };
      }
      const league = leagueOf(state.world, state.clubId);
      const fx = league.fixtures.find((f) => f.week === w && !f.played && (f.homeId === state.clubId || f.awayId === state.clubId));
      if (fx) {
        const opp = clubById(state.world, fx.homeId === state.clubId ? fx.awayId : fx.homeId);
        return {
          kind: 'match',
          title: w === state.week ? `${opp.name}, this week` : `${opp.name} in week ${w}`,
          detail: fx.homeId === state.clubId ? 'At home. Your crowd, your stage.' : 'Away from home — hostile ground.',
        };
      }
    }
  }
  return { kind: 'finale', title: 'The run-in', detail: 'The season is closing. Make the remaining weeks count.' };
}

// ---------------------------------------------------------------------------
// Signals — does this week deserve the player's attention?
// ---------------------------------------------------------------------------

export function weekSignal(state: CareerState, report: WeekReport): WeekSignal {
  const reasons: string[] = [];
  if (report.match && (report.match.involvement === 'start' || report.match.involvement === 'sub')) {
    if (report.match.goals > 0) reasons.push('you scored');
    if (report.match.rating !== null && report.match.rating >= 7.8) reasons.push('a standout performance');
    if (report.match.rating !== null && report.match.rating <= 4.5) reasons.push('a rough afternoon');
  }
  if (report.milestones.length > 0) reasons.push(report.milestones[0].title);
  if (report.statusChange) reasons.push(`status: now ${report.statusChange.to}`);
  if (report.injury) reasons.push('injury');
  if (report.life.firedEvent && !report.life.firedEvent.resolved) reasons.push('something waits in your inbox');
  if (state.coachRequest && state.coachRequest.honored === null) reasons.push('the coach wants an answer');
  if (report.seasonComplete || report.prologueComplete) reasons.push('the season closed');
  if (state.offers.length > 0) reasons.push('a transfer offer is on the table');
  const nextKind = state.calendar.weeks[state.week - 1];
  if (nextKind === 'league' && state.you.readiness < SIGNALS.lowReadinessBeforeMatch) reasons.push('low readiness before a match');
  const closeAmb = activeAmbitions(state).find((a) => a.active.progress >= SIGNALS.ambitionCloseness);
  if (closeAmb) reasons.push(`ambition nearly complete: ${closeAmb.def.title}`);
  return { worthStopping: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------------------
// Digest & recap
// ---------------------------------------------------------------------------

export function digestLine(state: CareerState, report: WeekReport): string {
  const bits: string[] = [];
  if (report.match) {
    const fx = report.match.fixture;
    const home = fx.homeId === state.clubId;
    const score = `${home ? fx.homeGoals : fx.awayGoals}–${home ? fx.awayGoals : fx.homeGoals}`;
    if (report.match.involvement === 'start' || report.match.involvement === 'sub') {
      bits.push(`${score}${report.match.goals ? `, you scored ${report.match.goals}` : ''}${report.match.rating !== null ? ` (rated ${report.match.rating.toFixed(1)})` : ''}`);
    } else {
      bits.push(`${score} — watched from the bench`);
    }
  } else {
    bits.push(report.kind === 'rest' ? 'a training week' : 'a quiet week');
  }
  if (report.statusChange) bits.push(`now ${report.statusChange.to}`);
  if (report.injury) bits.push(`injured (${report.injury.weeks}w)`);
  if (report.life.firedEvent) bits.push('life stirred');
  return `W${report.week}: ${bits.join('; ')}.`;
}

export interface Recap {
  where: string;
  recently: string[];
  next: NextBeat;
}

/** "Previously on your career" — derived entirely from persisted state. */
export function buildRecap(state: CareerState): Recap {
  const club = clubById(state.world, state.clubId);
  const pos = state.phase === 'senior' ? tablePosition(leagueOf(state.world, state.clubId), state.clubId) : null;
  const where = state.phase === 'prologue'
    ? `${state.you.name}, ${state.you.age}, ${club.name} academy — week ${state.week} of the youth season.`
    : `${state.you.name}, ${state.you.age} — ${state.you.status} at ${club.name}${pos ? `, ${ordinal(pos)} in the ${leagueOf(state.world, state.clubId).nationId === state.you.nationId ? 'league' : 'table'}` : ''}, week ${state.week}/${state.calendar.totalWeeks}.`;
  const recently: string[] = [];
  for (const r of state.lastReports.slice(0, 3)) recently.push(r.digest);
  const recentMs = state.milestones.slice(-2).reverse();
  for (const m of recentMs) if (!recently.some((x) => x.includes(m.title))) recently.push(`${m.title}.`);
  return { where, recently: recently.slice(0, 4), next: nextBeat(state) };
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
