// One modal for every authored life event: interrupt or inbox.
import type { LifeEventDef, Reason } from '@engine/index';
import { Btn, Modal, ReasonBlock } from '../bits';

export function EventModal({ def, why, onChoose }: {
  def: LifeEventDef;
  why?: Reason;
  onChoose: (choiceIndex: number) => void;
}) {
  return (
    <Modal>
      <p className="text-[11px] uppercase tracking-[0.18em] text-flood-400">{def.category.replace(':', ' · ')}</p>
      <h3 className="text-lg font-bold mt-1">{def.title}</h3>
      <p className="text-sm text-chalk-300 mt-2">{def.prompt}</p>
      {why && <ReasonBlock reason={why} />}
      <div className="mt-4 space-y-2">
        {def.choices.map((c, i) => (
          <Btn key={i} kind={i === 0 ? 'primary' : 'ghost'} className="w-full" onClick={() => onChoose(i)}>
            {c.label}
          </Btn>
        ))}
      </div>
    </Modal>
  );
}
