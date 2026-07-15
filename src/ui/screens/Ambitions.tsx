import { useState } from 'react';
import { offerableAmbitions } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card, SectionTitle } from '../bits';

export function Ambitions() {
  const career = useStore((s) => s.career);
  const act = useStore((s) => s.act);
  const setRoute = useStore((s) => s.setRoute);
  const [chosen, setChosen] = useState<string[]>([]);
  if (!career) return null;
  const offers = offerableAmbitions(career);
  const activeCount = career.ambitions.filter((a) => a.status === 'active').length;
  const slots = 3 - activeCount;

  const toggle = (id: string) =>
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < slots ? [...c, id] : c));

  const confirm = () => {
    const keep = career.ambitions.filter((a) => a.status === 'active').map((a) => a.defId);
    act({ type: 'setAmbitions', defIds: [...keep, ...chosen] });
    setRoute('hub');
  };

  return (
    <div className="p-5 pb-10 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mt-4">What are you chasing?</h2>
      <p className="text-chalk-500 text-sm mt-1 mb-5">
        Your ambitions, not the game’s. They shape the story you’re telling — pick up to {slots}, change them when life changes.
      </p>
      <SectionTitle>Available ambitions</SectionTitle>
      <div className="space-y-3">
        {offers.map((a) => {
          const on = chosen.includes(a.id);
          return (
            <Card key={a.id} onClick={() => toggle(a.id)} className={on ? 'border-flood-400' : ''}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{a.title}</h4>
                <span className={`h-4 w-4 rounded-full border ${on ? 'bg-flood-400 border-flood-400' : 'border-pitch-700'}`} />
              </div>
              <p className="text-xs text-chalk-500 mt-1">{a.flavor}</p>
            </Card>
          );
        })}
      </div>
      <Btn kind="gold" className="w-full mt-5" onClick={confirm} disabled={chosen.length === 0 && activeCount === 0}>
        {chosen.length > 0 ? `Commit to ${chosen.length} ambition${chosen.length > 1 ? 's' : ''}` : 'Decide later'}
      </Btn>
    </div>
  );
}
