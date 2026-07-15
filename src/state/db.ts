// Persistence: Dexie/IndexedDB. Autosave on every committed change.
// Wall-clock reads live HERE (outside the engine) — used only for the
// "welcome back" recap threshold, never for game state.
import Dexie, { type EntityTable } from 'dexie';
import type { CareerState } from '@engine/index';

export interface SaveRow {
  id: string;                 // career id
  state: CareerState;
  savedAt: number;            // wall clock, UI-only
  careerName: string;
  seasonLabel: string;
}

const db = new Dexie('touchline') as Dexie & {
  saves: EntityTable<SaveRow, 'id'>;
};

db.version(1).stores({
  saves: 'id, savedAt',
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
