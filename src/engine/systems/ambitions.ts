// Ambitions runtime: progress tracking + season verdicts. Story, never power.
import type { ActiveAmbition, AmbitionDef, CareerState, Milestone } from '../types/core';
import { AMBITION_BY_ID, AMBITIONS } from '../data/ambitions';
import { statusAtLeast, STATUS_ORDER } from './status';
import { leagueOf, tablePosition } from './league';
import { reason, up, down } from './reason';
import { clamp } from '../rng';

export function ambitionProgress(state: CareerState, def: AmbitionDef): number {
  const { you } = state;
  const m = def.metric;
  switch (m.kind) {
    case 'status_reach':
      return statusAtLeast(you.status, m.target) ? 1 :
        clamp(STATUS_ORDER.indexOf(you.status) / STATUS_ORDER.indexOf(m.target), 0, 0.95);
    case 'goals_season': return clamp(you.season.goals / m.target, 0, 1);
    case 'starts_season': return clamp(you.season.starts / m.target, 0, 1);
    case 'rating_season': {
      if (you.season.ratingCount < 3) return 0;
      const avg = you.season.ratingSum / you.season.ratingCount;
      return avg >= m.target ? 1 : clamp(avg / m.target - 0.05, 0, 0.95);
    }
    case 'save_cash': return clamp(you.cash / m.target, 0, 1);
    case 'meter_reach': return clamp(you.meters[m.meter] / m.target, 0, 1);
    case 'win_league': {
      if (state.phase === 'prologue') return 0;
      const pos = tablePosition(leagueOf(state.world, state.clubId), state.clubId);
      return pos === 1 ? (seasonDone(state) ? 1 : 0.9) : clamp(1 - (pos - 1) * 0.1, 0, 0.8);
    }
    case 'national_callup': return 0; // M3
    case 'stay_at_club_seasons': return clamp(you.career.seasons / m.target, 0, 1);
  }
}

function seasonDone(state: CareerState): boolean {
  return state.week >= state.calendar.totalWeeks;
}

export function refreshAmbitions(state: CareerState): void {
  for (const amb of state.ambitions) {
    if (amb.status !== 'active') continue;
    const def = AMBITION_BY_ID[amb.defId];
    if (!def) continue;
    amb.progress = ambitionProgress(state, def);
    if (amb.progress >= 1) {
      amb.status = 'completed';
      amb.verdictReason = reason(`Ambition achieved: ${def.title}.`, [up('you set this goal yourself — and delivered', 2)]);
      state.milestones.push(ambitionMilestone(state, def, true));
    }
  }
}

/** Season end: fail unfinished season-horizon ambitions honestly. */
export function settleSeasonAmbitions(state: CareerState): void {
  for (const amb of state.ambitions) {
    if (amb.status !== 'active') continue;
    const def = AMBITION_BY_ID[amb.defId];
    if (!def || def.horizon !== 'season') continue;
    amb.status = 'failed';
    amb.verdictReason = reason(`Fell short: ${def.title}.`, [
      down(`finished at ${Math.round(amb.progress * 100)}%`, 2),
      up('failure is story too — carry it into next season', 1),
    ]);
    state.milestones.push(ambitionMilestone(state, def, false));
  }
}

function ambitionMilestone(state: CareerState, def: AmbitionDef, achieved: boolean): Milestone {
  return {
    id: `ms_amb_${def.id}_s${state.season}`,
    week: state.week, season: state.season,
    title: achieved ? `Ambition achieved: ${def.title}` : `Ambition missed: ${def.title}`,
    detail: def.flavor,
    kind: 'ambition',
  };
}

/** Ambitions currently offerable, given career context. */
export function offerableAmbitions(state: CareerState): AmbitionDef[] {
  const active = new Set(state.ambitions.filter((a) => a.status === 'active').map((a) => a.defId));
  const done = new Set(state.ambitions.filter((a) => a.status === 'completed').map((a) => a.defId));
  return AMBITIONS.filter((def) => {
    if (active.has(def.id) || done.has(def.id)) return false;
    const g = def.gates;
    if (g?.minStatus && !statusAtLeast(state.you.status, g.minStatus)) return false;
    if (g?.maxStatus && statusAtLeast(state.you.status, g.maxStatus) && state.you.status !== g.maxStatus) return false;
    if (def.metric.kind === 'goals_season' && state.you.position !== 'ST' && def.metric.target > 8) return false;
    return true;
  });
}

export function setAmbitions(state: CareerState, defIds: string[]): void {
  const keep = state.ambitions.filter((a) => a.status !== 'active' || defIds.includes(a.defId));
  for (const a of state.ambitions) {
    if (a.status === 'active' && !defIds.includes(a.defId)) {
      a.status = 'retired';
      a.verdictReason = reason('You let this dream go.', [{ label: 'goals change — that is honest, not shameful', dir: 'flat' }]);
      keep.push(a);
    }
  }
  const existing = new Set(keep.map((a) => a.defId));
  for (const id of defIds.slice(0, 3)) {
    if (!existing.has(id) && AMBITION_BY_ID[id]) {
      keep.push({ defId: id, startedSeason: state.season, status: 'active', progress: 0 });
    }
  }
  state.ambitions = keep;
}

export function activeAmbitions(state: CareerState): Array<{ active: ActiveAmbition; def: AmbitionDef }> {
  return state.ambitions
    .filter((a) => a.status === 'active')
    .map((a) => ({ active: a, def: AMBITION_BY_ID[a.defId] }))
    .filter((x) => x.def !== undefined);
}
