import { useMemo, useState } from 'react';
import { generateProspects, NATION_BY_ID, POSITION_LABEL, clubById, createCareer } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card } from '../bits';

export function Prospect() {
  const newCareer = useStore((s) => s.newCareer);
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const prospects = useMemo(() => generateProspects(seed), [seed]);
  // a throwaway career gives us the generated world for club names
  const world = useMemo(() => createCareer('preview', { seed }).world, [seed]);

  return (
    <div className="p-5 pb-10 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mt-4">Three doors open.</h2>
      <p className="text-chalk-500 text-sm mt-1 mb-5">Three academies, three lives. Choose who you become — everything after is yours to steer.</p>
      <div className="space-y-4">
        {prospects.map((p, i) => {
          const nation = NATION_BY_ID[p.nationId];
          const club = clubById(world, p.clubId);
          return (
            <Card key={i}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                <span className="text-xs text-chalk-500">{nation.name}</span>
              </div>
              <p className="text-xs text-flood-400 mt-0.5">{POSITION_LABEL[p.position]} · {club.name} academy</p>
              <p className="text-sm text-chalk-300 mt-2">{p.backstory}</p>
              <p className="text-xs text-chalk-500 mt-2">
                Potential whispered about: <span className="text-chalk-100">{p.potentialBand}</span>
                {p.profile.familyExpectation === 'high' ? ' · the whole family is counting on this' : ''}
              </p>
              <Btn className="mt-3 w-full" onClick={() => newCareer(i, seed)}>Live this life</Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
