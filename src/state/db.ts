// Persistence: Dexie/IndexedDB. Autosave on every committed change.
// The legacy table is the months engine: every finished career is enshrined.
// Wall-clock reads live HERE (outside the engine) — used only for the
// "welcome back" recap threshold, never for game state.
import Dexie, { type EntityTable } from 'dexie';
import type { CareerState, Milestone } from '@engine/index';

export interface SaveRow {
  id: string;                 // career id
  state: CareerState;
  savedAt: number;            // wall clock, UI-only
  careerName: string;
  seasonLabel: string;
}

export interface LegacyRow {
  id: string;                 // career id
  name: string;
  nationId: string;
  position: string;
  seed: number;
  prospectIndex: number;
  seasons: number;
  apps: number;
  goals: number;
  assists: number;
  epithet: string;
  endedReason: string;
  honours: string[];          // trophy milestone titles
  definingMoments: Milestone[];
  archetypeFlags: string[];   // pro_track / icon_track / one_club_icon / ...
  finishedAt: number;
}

const db = new Dexie('touchline') as Dexie & {
  saves: EntityTable<SaveRow, 'id'>;
  legacy: EntityTable<LegacyRow, 'id'>;
};

db.version(2).stores({
  saves: 'id, savedAt',
  legacy: 'id, finishedAt',
});

export async function saveCareer(state: CareerState): Promise<void> {
  await db.saves.put({
    id: state.id,
    state,
    savedAt: Date.now(),
    careerName: state.you.name,
    seasonLabel: state.phase === 'prologue' ? 'Youth season' : `Season ${state.season}`,
  });
}

export async function loadMostRecent(): Promise<SaveRow | undefined> {
  return db.saves.orderBy('savedAt').last();
}

export async function listSaves(): Promise<SaveRow[]> {
  return db.saves.orderBy('savedAt').reverse().toArray();
}

export async function deleteSave(id: string): Promise<void> {
  await db.saves.delete(id);
}

const ARCHETYPE_FLAGS = ['pro_track', 'icon_track', 'one_club_icon', 'family_anchor_set', 'smart_money', 'natural_leader', 'global_icon', 'reinvented'];

export async function enshrineCareer(state: CareerState, epithetLine: string): Promise<void> {
  const trophies = state.milestones.filter((m) => m.kind === 'trophy').map((m) => m.title);
  const defining = state.milestones
    .filter((m) => ['debut', 'first_goal', 'transfer', 'trophy', 'callup', 'status', 'retirement'].includes(m.kind))
    .slice(-14);
  await db.legacy.put({
    id: state.id,
    name: state.you.name,
    nationId: state.you.nationId,
    position: state.you.position,
    seed: state.seed,
    prospectIndex: state.prospectIndex,
    seasons: state.you.career.seasons,
    apps: state.you.career.apps,
    goals: state.you.career.goals,
    assists: state.you.career.assists,
    epithet: epithetLine,
    endedReason: state.endedReason ?? 'retired',
    honours: trophies,
    definingMoments: defining,
    archetypeFlags: ARCHETYPE_FLAGS.filter((f) => f in state.flags),
    finishedAt: Date.now(),
  });
}

export async function listLegacy(): Promise<LegacyRow[]> {
  return db.legacy.orderBy('finishedAt').reverse().toArray();
}
