// The Records Book — the months engine. Every finished career is enshrined;
// records invite you to beat your own legend; Sliding Doors replays a life
// with the same seed and different choices. Variety, never power.
import { useEffect, useState } from 'react';
import { NATION_BY_ID, type NationId } from '@engine/index';
import { useStore } from '@state/store';
import { listLegacy, type LegacyRow } from '@state/db';
import { Btn, Card, SectionTitle } from '../bits';

const ARCHETYPE_LABEL: Record<string, string> = {
  pro_track: 'The Consummate Pro', icon_track: 'The Magnetic Maverick',
  one_club_icon: 'The One-Club Legend', family_anchor_set: 'The Family Anchor',
  smart_money: 'The Financial Dynasty', natural_leader: 'The Respected Leader',
  global_icon: 'Global Icon', reinvented: 'The Reinvention',
};
const ALL_ARCHETYPES = ['pro_track', 'icon_track', 'one_club_icon', 'family_anchor_set', 'smart_money', 'natural_leader'];

export function Legacy() {
  const setRoute = useStore((s) => s.setRoute);
  const newCareer = useStore((s) => s.newCareer);
  const [rows, setRows] = useState<LegacyRow[]>([]);
  useEffect(() => { void listLegacy().then(setRows); }, []);

  const lived = new Set(rows.flatMap((r) => r.archetypeFlags));
  const unlived = ALL_ARCHETYPES.filter((a) => !lived.has(a));
  const records = {
    goals: Math.max(0, ...rows.map((r) => r.goals)),
    apps: Math.max(0, ...rows.map((r) => r.apps)),
    honours: Math.max(0, ...rows.map((r) => r.honours.length)),
  };

  return (
    <div className="p-5 pb-10 max-w-md mx-auto space-y-4">
      <header className="pt-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-flood-400">The Records Book</p>
        <h2 className="text-2xl font-black mt-1">Every life you’ve lived.</h2>
      </header>

      {rows.length === 0 && (
        <Card><p className="text-sm text-chalk-500">No finished careers yet. The first page of this book is waiting for a whole life.</p></Card>
      )}

      {rows.length > 0 && (
        <Card>
          <SectionTitle>All-time records</SectionTitle>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold">{records.goals}</p><p className="text-[10px] text-chalk-500 uppercase">Most goals</p></div>
            <div><p className="text-lg font-bold">{records.apps}</p><p className="text-[10px] text-chalk-500 uppercase">Most apps</p></div>
            <div><p className="text-lg font-bold">{records.honours}</p><p className="text-[10px] text-chalk-500 uppercase">Most honours</p></div>
          </div>
          <p className="text-[10px] text-chalk-500 mt-2 text-center">Records exist to be broken — by you.</p>
        </Card>
      )}

      {unlived.length > 0 && (
        <Card className="border-calm-500/40">
          <SectionTitle>Stories you haven’t lived</SectionTitle>
          <p className="text-sm text-chalk-300">{unlived.length} of the six great careers remain unwritten{rows.length > 0 ? `: who will be ${ARCHETYPE_LABEL[unlived[0]].toLowerCase()}?` : '.'}</p>
        </Card>
      )}

      {rows.map((r) => (
        <Card key={r.id}>
          <div className="flex items-baseline justify-between">
            <h3 className="font-bold">{r.name}</h3>
            <span className="text-xs text-chalk-500">{NATION_BY_ID[r.nationId as NationId]?.name}</span>
          </div>
          <p className="text-xs text-flood-400 mt-0.5">“{r.epithet}” · {r.endedReason === 'broke' ? 'ended broke' : 'retired'}</p>
          <p className="text-xs text-chalk-500 mt-1">
            {r.seasons} seasons · {r.apps} apps · {r.goals} goals · {r.assists} assists
            {r.honours.length > 0 ? ` · ${r.honours.length} 🏆` : ''}
          </p>
          {r.archetypeFlags.length > 0 && (
            <p className="text-xs text-chalk-300 mt-1">{r.archetypeFlags.map((f) => ARCHETYPE_LABEL[f]).filter(Boolean).join(' · ')}</p>
          )}
          <button
            className="mt-2 text-xs text-calm-500 underline underline-offset-2"
            onClick={() => newCareer(r.prospectIndex, r.seed)}>
            Sliding Doors — relive this prospect, choose differently
          </button>
        </Card>
      ))}

      <div className="flex gap-2">
        <Btn kind="gold" className="flex-1" onClick={() => setRoute('prospect')}>Begin a new life</Btn>
        <Btn kind="ghost" className="flex-1" onClick={() => setRoute('title')}>Title</Btn>
      </div>
    </div>
  );
}
