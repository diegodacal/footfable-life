// A transfer offer: scout the suitor, judge your route to the XI, decide.
import { clubById, NATION_BY_ID, playerOfClub, ECONOMY, type TransferOffer } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Modal, ReasonBlock } from '../bits';

export function OfferModal({ offer, onClose }: { offer: TransferOffer; onClose: () => void }) {
  const career = useStore((s) => s.career)!;
  const act = useStore((s) => s.act);
  const club = clubById(career.world, offer.clubId);
  const nation = NATION_BY_ID[club.nationId];
  const abroad = club.nationId !== career.you.profile.origin;
  const myClub = clubById(career.world, career.clubId);
  const rivals = playerOfClub(career, offer.clubId)
    .filter((p) => p.position === career.you.position)
    .sort((a, b) => b.ability - a.ability);
  const newWage = ECONOMY.wageByStatus[career.you.status] * (1 + ECONOMY.clubStrengthWageSlope * (club.strength - 60)) * offer.wageMult;

  return (
    <Modal>
      <p className="text-[11px] uppercase tracking-[0.18em] text-flood-400">Transfer offer</p>
      <h3 className="text-xl font-bold mt-1">{club.name}</h3>
      <p className="text-xs text-chalk-500">{nation.name} · {nation.leagueName}{club.division === 2 ? ' (Div 2)' : ''} · club level {club.strength}{club.strength > myClub.strength ? ' — a step up' : club.strength < myClub.strength - 4 ? ' — a step down, maybe more football' : ''}</p>
      <ReasonBlock reason={offer.reason} />
      <div className="mt-3 rounded-lg bg-pitch-800 p-3 text-xs space-y-1">
        <p>They see you as: <b className="text-flood-400">{offer.rolePromise}</b></p>
        <p>Wage: <b>€{(newWage * ECONOMY.moneyUnit / 1000).toFixed(0)}k/w</b> <span className="text-chalk-500">(now €{(career.you.weeklyWage * ECONOMY.moneyUnit / 1000).toFixed(0)}k/w)</span></p>
        {abroad && <p className="text-calm-500">A foreign league — a new life chapter. Your national-team eligibility never changes: {NATION_BY_ID[career.you.profile.origin].name} can always call you.</p>}
      </div>
      <div className="mt-3">
        <p className="text-[10px] uppercase tracking-widest text-chalk-500 mb-1">Your competition there ({career.you.position})</p>
        {rivals.slice(0, 4).map((r) => (
          <p key={r.id} className="text-xs text-chalk-300">{r.name} · {r.age} · ability {Math.round(r.ability)} · form {r.form.toFixed(1)}</p>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Btn kind="gold" className="flex-1" onClick={() => { act({ type: 'acceptOffer', offerId: offer.id }); onClose(); }}>Sign for them</Btn>
        <Btn kind="ghost" className="flex-1" onClick={() => { act({ type: 'rejectOffer', offerId: offer.id }); onClose(); }}>Turn it down</Btn>
      </div>
      {club.strength > myClub.strength + 4 && (
        <p className="text-[10px] text-chalk-500 mt-2">Turning down a bigger club is loyalty — and loyalty compounds into its own story.</p>
      )}
    </Modal>
  );
}
