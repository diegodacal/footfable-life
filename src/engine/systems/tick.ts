// The weekly orchestrator. advanceWeek is pure: it clones, runs the week, and
// either returns the committed result or (for an interactive moment) returns a
// "needs" marker WITHOUT committing — determinism makes the replay identical.
import type {
  AdvanceResult, CareerState, Fixture, Milestone, MatchResult, WeekDecisions, WeekReport,
} from '../types/core';
import { CALENDAR, ECONOMY, MATCH } from '../data/constants';
import { TRAINING } from '../data/trainingConfig';
import { EVENT_BY_ID } from '../data/events';
import { childSeed, clamp, mulberry32, pick, rint } from '../rng';
import { resolveTraining, applyMatchDevelopment, injuryRoll } from './training';
import { selectWeek } from './selection';
import { resolveMatch } from './match';
import { updateStatus } from './status';
import { rollLifeEvent, runMetersEconomy } from './life';
import { refreshAmbitions, settleSeasonAmbitions } from './ambitions';
import { stakesLine, digestLine } from './narrator';
import { clubById, leagueOf, generateSplitFixtures, rebuildTable, resolveWorldWeek, tablePosition } from './league';
import { reason, up, flat } from './reason';
import { buildSeniorCalendar } from '../worldgen';
import { rollSeason } from './seasonRoll';
import { maybeGenerateOffer, runAiTransferWindow } from './transfers';
import { initGlobalCup, isGlobalCupSeason, nationalTeamStrength, resolveKnockout } from './nationalTeam';
import { NATION_BY_ID } from '../data/nations';

const YOUTH_OPPONENTS = ['the Northern Academy', 'the Capital Youth XI', 'the Port Boys', 'the Mining Town Academy', 'the University Colts'];

export function advanceWeek(input: CareerState, decisions: WeekDecisions = {}): AdvanceResult {
  if (input.endedReason) throw new Error('career is over — start a new one from the Records Book');
  const state = structuredClone(input);
  const weekKind = state.calendar.weeks[state.week - 1];
  const stakes = stakesLine(state);
  const milestones: Milestone[] = [];

  // -- injuries tick down at week start
  if (state.you.injuryWeeks > 0) state.you.injuryWeeks--;

  // -- the Global Cup opens: merit selection over your birth nation's worldwide pool
  if (weekKind === 'cup' && !state.cup) {
    state.cup = initGlobalCup(state);
    if (state.cup.called) {
      milestones.push(ms(state, 'callup', `Called up by ${NATION_BY_ID[state.you.nationId].name}`, state.cup.callReason.headline));
    } else {
      state.news.unshift({ season: state.season, week: state.week, text: `The Global Cup begins — no call-up this cycle. ${state.cup.callReason.headline}` });
    }
  }

  // -- coach request may arrive (senior only)
  maybeCoachRequest(state);

  // -- transfer window: offers arrive, the world's market moves
  maybeGenerateOffer(state);
  if (state.phase === 'senior' && state.week === state.calendar.windowWeeks[state.calendar.windowWeeks.length - 1]) {
    runAiTransferWindow(state, `s${state.season}w${state.week}`);
  }

  // -- Phase A: life event roll (pre-match; can pause the week)
  const eventPhase = rollLifeEvent(state, decisions.life);
  if (eventPhase.needsInterrupt) {
    return { kind: 'needs-life', event: eventPhase.needsInterrupt.event, reason: eventPhase.needsInterrupt.reason };
  }

  // -- training (uses last week's match minutes for readiness cost)
  const lastMinutes = state.you.minutesLog.length > 0 ? state.you.minutesLog[state.you.minutesLog.length - 1] : 0;
  const training = resolveTraining(state, lastMinutes);

  // -- the Global Cup week (group matches are yours to play; the knockout is one dramatic week)
  let match: MatchResult | null = null;
  let injury: WeekReport['injury'] = null;
  if (weekKind === 'cup' && state.cup) {
    const cup = state.cup;
    if (cup.called && cup.groupGamesPlayed < 3 && !cup.eliminated) {
      const opp = cup.groupOpponents[cup.groupGamesPlayed];
      const nation = NATION_BY_ID[state.you.nationId];
      const fixture: Fixture = { week: state.week, homeId: 'nt_us', awayId: 'nt_opp', played: false, homeGoals: 0, awayGoals: 0 };
      const isFirstCap = !state.flags['first_cap'];
      const outcome = resolveMatch({
        state, fixture,
        involvement: 'start',
        selectionReason: reason(`You start for ${nation.name}.`, [up('selected on pure merit from your nation’s worldwide pool', 2)]),
        isDebut: isFirstCap,
        decisionChoice: decisions.match,
        usName: nation.name, usStrength: nationalTeamStrength(state, state.you.nationId),
        opponentName: opp.name, opponentStrength: opp.strength,
        homeSide: true,
      });
      if (outcome.kind === 'needs-decision') {
        return { kind: 'needs-match', decision: outcome.decision, minute: outcome.minute };
      }
      match = outcome.result;
      cup.groupGamesPlayed++;
      cup.yourGoals += match.goals;
      const won = fixture.homeGoals > fixture.awayGoals;
      const drew = fixture.homeGoals === fixture.awayGoals;
      cup.groupPoints += won ? 3 : drew ? 1 : 0;
      if (isFirstCap && match.minutes > 0) {
        state.flags['first_cap'] = state.absoluteWeek;
        milestones.push(ms(state, 'callup', 'First cap', `You wore your country’s shirt with everything watching.`));
      }
      if (match.rating !== null) {
        state.you.form = clamp(MATCH.formAlpha * match.rating + (1 - MATCH.formAlpha) * state.you.form, 2, 9.5);
      }
      state.you.readiness = clamp(state.you.readiness - 10, 0, 100);
      applyMatchDevelopment(state, match.minutes, opp.strength);
      if (cup.groupGamesPlayed === 3 && cup.groupPoints < 4) {
        cup.eliminated = true;
        cup.finishText = 'Out at the group stage.';
      }
    } else if (cup.groupGamesPlayed >= 3 && cup.finishText === null && cup.champion === null) {
      // the knockout week: the whole run, one held breath
      const run = resolveKnockout(state);
      cup.finishText = run.yourRun;
      for (const l of run.lines) state.news.unshift({ season: state.season, week: state.week, text: l });
    }
  }

  if (weekKind === 'league') {
    const outcome = playMatchWeek(state, decisions);
    if (outcome.kind === 'needs-decision') {
      return { kind: 'needs-match', decision: outcome.decision, minute: outcome.minute };
    }
    match = outcome.result;

    // consequences of the match, derived forward
    const played = match.minutes > 0;
    state.you.minutesLog.push(match.minutes);
    if (state.you.minutesLog.length > 30) state.you.minutesLog.shift();
    if (played) {
      const isFirstSenior = state.phase === 'senior' && state.you.career.apps === 0;
      state.you.season.apps++;
      if (match.involvement === 'start') state.you.season.starts++;
      state.you.season.minutes += match.minutes;
      state.you.season.goals += match.goals;
      state.you.season.assists += match.assists;
      if (match.rating !== null) {
        state.you.season.ratingSum += match.rating;
        state.you.season.ratingCount++;
        state.you.form = clamp(MATCH.formAlpha * match.rating + (1 - MATCH.formAlpha) * state.you.form, 2, 9.5);
        state.you.standing = clamp(state.you.standing + (match.rating - 6) * 0.8, 0, 100);
      }
      if (state.phase === 'senior') {
        state.you.career.apps++;
        state.you.career.goals += match.goals;
        state.you.career.assists += match.assists;
        if (isFirstSenior) {
          milestones.push(ms(state, 'debut', 'Professional debut', `First senior minutes, aged ${state.you.age}.`));
        }
        if (match.goals > 0 && state.you.career.goals === match.goals) {
          milestones.push(ms(state, 'first_goal', 'First senior goal', 'The one you never forget.'));
        }
        if (match.assists > 0 && state.you.career.assists === match.assists) {
          milestones.push(ms(state, 'first_assist', 'First senior assist', 'Unselfish, decisive.'));
        }
      }
      const inj = injuryRoll(state, mulberry32(childSeed(state.seed, `injury:${state.absoluteWeek}`)), match.minutes);
      if (inj) {
        state.you.injuryWeeks = inj.weeks;
        injury = inj;
        milestones.push(ms(state, 'injury', 'Injured', `Out for ~${inj.weeks} week${inj.weeks > 1 ? 's' : ''}.`));
      }
      applyMatchDevelopment(state, match.minutes, opponentStrengthOf(state, match));
    } else {
      state.you.minutesLog[state.you.minutesLog.length - 1] = 0;
    }
  }

  // -- the rest of the world plays
  if (state.phase === 'senior') {
    resolveWorldWeek(state.seed + state.season, state.world, state.week, state.absoluteWeek, match?.fixture ?? null);
    const roundIndex = CALENDAR.leagueRoundWeeks.indexOf(state.week as (typeof CALENDAR.leagueRoundWeeks)[number]);
    if (roundIndex === CALENDAR.splitAfterRound - 1) {
      for (const league of state.world.leagues) generateSplitFixtures(state.seed + state.season, league);
    }
    // rival form drifts at your club (deep tier)
    const rng = mulberry32(childSeed(state.seed, `rivals:${state.absoluteWeek}`));
    for (const p of state.world.players) {
      if (p.clubId === state.clubId && p.squad === 'senior') {
        p.form = clamp(p.form + (rng() - 0.5) * 0.6, 3.5, 9);
      }
    }
  }

  // -- status ladder
  const statusChange = state.phase === 'senior' ? updateStatus(state) : null;
  if (statusChange) {
    milestones.push(ms(state, 'status', `Now a ${statusChange.to}`, statusChange.reason.headline));
    state.you.weeklyWage = wageFor(state);
  }

  // -- Phase B: meters + economy
  const meters = runMetersEconomy(state, match);
  const lifeWeek = {
    moves: [...eventPhase.moves, ...meters.moves],
    firedEvent: eventPhase.fired,
    ledger: meters.ledger,
  };

  // -- debt escalation: telegraphed, never sudden (LIFE_SYSTEM §5.2; senior careers only)
  if (state.you.cash < 0 && state.phase === 'senior') {
    state.debtWeeks++;
    if (state.debtWeeks === 4) {
      state.news.unshift({ season: state.season, week: state.week, text: 'Your accountant calls: the balance has been red for a month. This gets worse before it gets better.' });
    }
    if (state.debtWeeks === 8) {
      state.news.unshift({ season: state.season, week: state.week, text: 'FINAL WARNING: creditors are circling. Clear the debt or the career ends broke.' });
    }
    if (state.debtWeeks >= 12 || state.you.cash < ECONOMY.brokeThreshold) {
      state.endedReason = 'broke';
      milestones.push(ms(state, 'retirement', 'Broke', 'The money ran out before the talent did. The cautionary tale, complete.'));
    }
  } else {
    state.debtWeeks = 0;
  }

  // -- birthday
  if (state.phase === 'senior' && state.week === state.you.birthWeek) {
    state.you.age++;
    milestones.push(ms(state, 'life', `Turned ${state.you.age}`, 'Another year in the game.'));
  }

  // -- ambitions
  refreshAmbitions(state);
  for (const m of milestones) if (m.kind === 'first_goal') queueCelebration(state);

  // -- season boundaries
  let seasonComplete = false;
  let prologueComplete = false;
  if (state.week >= state.calendar.totalWeeks) {
    if (state.phase === 'prologue') {
      prologueComplete = true;
      completePrologue(state, milestones);
    } else {
      seasonComplete = true;
      completeSeason(state, milestones);
    }
  } else {
    state.week++;
  }
  state.absoluteWeek++;
  state.milestones.push(...milestones);

  const report: WeekReport = {
    week: input.week, season: input.season, kind: weekKind,
    match, training, life: lifeWeek, statusChange, injury,
    milestones, stakes,
    digest: '', seasonComplete, prologueComplete,
  };
  report.digest = digestLine(state, report);
  state.lastReports.unshift(report);
  if (state.lastReports.length > 6) state.lastReports.pop();

  return { kind: 'done', state, report };
}

/** Headless advance: auto-answers any interactive moment with a sensible default. */
export function tick(input: CareerState): { state: CareerState; report: WeekReport } {
  let res = advanceWeek(input, {});
  const decisions: WeekDecisions = {};
  let guard = 0;
  while (res.kind !== 'done' && guard++ < 4) {
    if (res.kind === 'needs-life') decisions.life = 0;
    if (res.kind === 'needs-match') decisions.match = 0;
    res = advanceWeek(input, decisions);
  }
  if (res.kind !== 'done') throw new Error('tick failed to converge');
  return { state: res.state, report: res.report };
}

// ---------------------------------------------------------------------------

function playMatchWeek(state: CareerState, decisions: WeekDecisions) {
  const usClub = clubById(state.world, state.clubId);
  if (state.phase === 'prologue') {
    const rng = mulberry32(childSeed(state.seed, `youthfx:${state.absoluteWeek}`));
    const fixture: Fixture = { week: state.week, homeId: state.clubId, awayId: `youth_${state.week}`, played: false, homeGoals: 0, awayGoals: 0 };
    return resolveMatch({
      state, fixture,
      involvement: 'start',
      selectionReason: reason('You start for the academy side.', [up('youth football is your stage — take it', 1)]),
      isDebut: false,
      decisionChoice: decisions.match,
      usName: `${usClub.name} U19`, usStrength: usClub.strength - 22,
      opponentName: pick(rng, YOUTH_OPPONENTS), opponentStrength: usClub.strength - 26 + rint(rng, -4, 8),
      homeSide: true,
    });
  }
  const league = leagueOf(state.world, state.clubId);
  const fixture = league.fixtures.find(
    (f) => f.week === state.week && !f.played && (f.homeId === state.clubId || f.awayId === state.clubId),
  );
  if (!fixture) return { kind: 'result' as const, result: null as unknown as MatchResult };
  const selection = selectWeek(state);
  const homeSide = fixture.homeId === state.clubId;
  const opp = clubById(state.world, homeSide ? fixture.awayId : fixture.homeId);
  return resolveMatch({
    state, fixture,
    involvement: selection.involvement,
    selectionReason: selection.reason,
    isDebut: state.you.career.apps === 0,
    decisionChoice: decisions.match,
    usName: usClub.name, usStrength: usClub.strength,
    opponentName: opp.name, opponentStrength: opp.strength,
    homeSide,
  });
}

function opponentStrengthOf(state: CareerState, match: MatchResult): number {
  const fx = match.fixture;
  const oppId = fx.homeId === state.clubId ? fx.awayId : fx.homeId;
  const opp = state.world.clubs.find((c) => c.id === oppId);
  return opp ? opp.strength : clubById(state.world, state.clubId).strength - 24;
}

function maybeCoachRequest(state: CareerState): void {
  if (state.phase !== 'senior') return;
  if (state.coachRequest) {
    state.coachRequest.weeksLeft--;
    if (state.coachRequest.weeksLeft <= 0) state.coachRequest = null;
    return;
  }
  const cfg = TRAINING.coachRequest;
  if ((state.seasonFired['__coachreq__'] ?? 0) >= cfg.seasonCap) return;
  if ((state.cooldowns['__coachreq__'] ?? 0) > state.absoluteWeek) return;
  const rng = mulberry32(childSeed(state.seed, `coachreq:${state.absoluteWeek}`));
  if (rng() > cfg.triggerChance) return;
  // the coach targets your weakest block relative to potential
  const gaps: Record<'technical' | 'physical' | 'mental', number> = { technical: 0, physical: 0, mental: 0 };
  const blocks = { technical: ['finishing', 'passing', 'control'], physical: ['pace', 'strength', 'stamina'], mental: ['composure', 'positioning'] } as const;
  for (const [block, attrs] of Object.entries(blocks)) {
    for (const a of attrs) gaps[block as keyof typeof gaps] += state.you.potential[a as keyof typeof state.you.potential] - state.you.attributes[a as keyof typeof state.you.attributes];
  }
  const block = (Object.entries(gaps).sort((a, b) => b[1] - a[1])[0][0]) as 'technical' | 'physical' | 'mental';
  state.coachRequest = {
    block,
    weeksLeft: cfg.windowWeeks,
    honored: null,
    reason: reason(`The coach wants you working on your ${block} game.`, [
      up('he sees room you are not using', 1),
      flat('accept for standing, refuse for freedom'),
    ]),
  };
  state.cooldowns['__coachreq__'] = state.absoluteWeek + cfg.cooldownWeeks;
  state.seasonFired['__coachreq__'] = (state.seasonFired['__coachreq__'] ?? 0) + 1;
}

function queueCelebration(state: CareerState): void {
  const def = EVENT_BY_ID['evt_celebration_first_goal'];
  if (!def) return;
  if (state.eventLog.some((e) => e.eventId === def.id) || state.inbox.some((e) => e.eventId === def.id)) return;
  state.inbox.push({
    eventId: def.id, week: state.week, season: state.season, resolved: false,
    reason: reason('A first goal deserves marking.', [up('milestones are for celebrating', 1)]),
  });
}

function wageFor(state: CareerState): number {
  const club = clubById(state.world, state.clubId);
  const base = ECONOMY.wageByStatus[state.you.status];
  return Math.round(base * (1 + ECONOMY.clubStrengthWageSlope * (club.strength - 60)) * 10) / 10;
}

function ms(state: CareerState, kind: Milestone['kind'], title: string, detail: string): Milestone {
  return { id: `ms_${kind}_${state.absoluteWeek}`, week: state.week, season: state.season, title, detail, kind };
}

// ---------------------------------------------------------------------------
// Boundaries
// ---------------------------------------------------------------------------

function completePrologue(state: CareerState, milestones: Milestone[]): void {
  milestones.push(ms(state, 'callup', 'Called up to the first team', 'The academy year is over. The first-team squad list has your name on it.'));
  state.phase = 'senior';
  state.you.status = 'Backup';
  state.season = 1;
  state.week = 1;
  state.calendar = buildSeniorCalendar();
  state.you.readiness = TRAINING.readiness.seasonReset;
  state.you.weeklyWage = wageFor(state);
  state.you.minutesLog = [];
  state.seasonFired = {};
  resetSeasonStats(state);
  // the first professional contract is a moment waiting on the doormat
  state.inbox.push({
    eventId: 'evt_first_contract', week: 1, season: 1, resolved: false,
    reason: reason('The club wants to make it official.', [up('your youth season earned this', 2)]),
  });
}

function completeSeason(state: CareerState, milestones: Milestone[]): void {
  const league = leagueOf(state.world, state.clubId);
  rebuildTable(league);
  const pos = tablePosition(league, state.clubId);
  if (pos === 1) {
    milestones.push(ms(state, 'trophy', league.division === 1 ? 'LEAGUE CHAMPIONS' : 'DIVISION 2 CHAMPIONS', `${clubById(state.world, state.clubId).name} win the title — and you were part of it.`));
  }
  milestones.push(ms(state, 'season', `Season ${state.season} complete`, seasonSummaryLine(state, pos)));
  settleSeasonAmbitions(state);
  state.you.career.seasons++;

  // a Global Cup season closes with the tournament in the books
  if (state.cup) {
    if (state.cup.finishText) {
      milestones.push(ms(state, 'callup', 'The Global Cup, concluded', state.cup.finishText));
    }
    state.cup = null;
  }

  // loan spell ends: back to the parent club
  if (state.loanFromClubId) {
    const parent = clubById(state.world, state.loanFromClubId);
    milestones.push(ms(state, 'transfer', `Back at ${parent.name}`, 'The loan is over. Time to show them what you became out there.'));
    state.clubId = state.loanFromClubId;
    state.loanFromClubId = null;
    state.you.minutesLog = [];
    state.you.standing = 50;
  }

  // the body decides when the story can end — the ending itself is authored
  if (state.you.age >= 38) {
    state.endedReason = 'retired';
    milestones.push(ms(state, 'retirement', 'The final whistle', `At ${state.you.age}, the body calls time. What a road it was.`));
  } else if (state.you.age >= 33 && !state.inbox.some((e) => e.eventId === 'evt_retirement_call')) {
    state.inbox.push({
      eventId: 'evt_retirement_call', week: state.week, season: state.season, resolved: false,
      reason: reason('The question every player faces.', [flat('you decide when this story ends — that is the whole point')]),
    });
  }

  // season-boundary market + the world ages one year, then fresh fixtures
  runAiTransferWindow(state, `boundary-s${state.season}`);
  state.season++;
  state.week = 1;
  state.calendar = buildSeniorCalendar(isGlobalCupSeason(state.season));
  state.you.readiness = Math.max(state.you.readiness, TRAINING.readiness.seasonReset);
  state.seasonFired = {};
  state.offers = [];
  resetSeasonStats(state);
  rollSeason(state);
}

function seasonSummaryLine(state: CareerState, pos: number): string {
  const s = state.you.season;
  const avg = s.ratingCount > 0 ? (s.ratingSum / s.ratingCount).toFixed(1) : '—';
  return `${s.apps} apps, ${s.goals} goals, ${s.assists} assists, avg ${avg}. Club finished ${pos}${pos === 1 ? 'st — champions' : ordSuffix(pos)}.`;
}

function ordSuffix(n: number): string {
  const v = n % 100;
  return ['th', 'st', 'nd', 'rd'][(v - 20) % 10] ?? ['th', 'st', 'nd', 'rd'][v] ?? 'th';
}

function resetSeasonStats(state: CareerState): void {
  state.you.season = { apps: 0, starts: 0, minutes: 0, goals: 0, assists: 0, ratingSum: 0, ratingCount: 0 };
}

