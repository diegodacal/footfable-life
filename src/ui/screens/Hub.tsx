// The week hub — the spine. See where you stand, act, advance.
import {
  stakesLine, nextBeat, epithet, clubById, leagueOf, tablePosition, ordinal,
  activeAmbitions, readinessBand, BLOCK_LABEL, EVENT_BY_ID,
  type Block, type Intensity,
} from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card, SectionTitle, StatusChip, ReasonBlock } from '../bits';
import { BottomNav } from '../components/BottomNav';
import { useState } from 'react';
import { EventModal } from '../components/EventModal';

const BLOCKS: Block[] = ['technical', 'physical', 'mental'];
const INTENSITIES: Intensity[] = ['intensive', 'balanced', 'recover'];

export function Hub() {
  const career = useStore((s) => s.career);
  const advance = useStore((s) => s.advance);
  const continueToBeat = useStore((s) => s.continueToBeat);
  const act = useStore((s) => s.act);
  const [inboxOpen, setInboxOpen] = useState<string | null>(null);
  if (!career) return null;
  const { you, training } = career;
  const club = clubById(career.world, career.clubId);
  const beat = nextBeat(career);
  const stakes = stakesLine(career);
  const isSenior = career.phase === 'senior';
  const pos = isSenior ? tablePosition(leagueOf(career.world, career.clubId), career.clubId) : null;
  const ambs = activeAmbitions(career);
  const weekKind = career.calendar.weeks[career.week - 1];
  const openEvent = inboxOpen ? EVENT_BY_ID[inboxOpen] : null;

  const setBlock = (which: 'primary' | 'secondary', block: Block) => {
    const other = which === 'primary' ? training.secondary : training.primary;
    if (block === other) {
      act({ type: 'setTraining', plan: { ...training, primary: training.secondary, secondary: training.primary } });
    } else {
      act({ type: 'setTraining', plan: { ...training, [which]: block } });
    }
  };

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* header */}
      <header className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold leading-tight">{you.name}</h1>
            <p className="text-xs text-chalk-500">“{epithet(career)}” · {club.name}{pos ? ` · ${ordinal(pos)}` : ''}</p>
          </div>
          <StatusChip status={you.status} />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-chalk-500">
          <span>{career.phase === 'prologue' ? 'Youth season' : `Season ${career.season}`} · Week {career.week}/{career.calendar.totalWeeks}</span>
          <span>Form <b className="text-chalk-100">{you.form.toFixed(1)}</b></span>
          <span>Readiness <b className={you.readiness < 45 ? 'text-alert-500' : 'text-chalk-100'}>{Math.round(you.readiness)}</b> ({readinessBand(you.readiness).toLowerCase()})</span>
        </div>
        {you.injuryWeeks > 0 && (
          <p className="mt-2 text-xs text-alert-500">Injured — {you.injuryWeeks} week{you.injuryWeeks > 1 ? 's' : ''} to go.</p>
        )}
      </header>

      <div className="px-5 space-y-4">
        {/* the Next Beat card */}
        <Card className="border-flood-500/40 bg-gradient-to-br from-pitch-900 to-pitch-800">
          <SectionTitle>Next beat</SectionTitle>
          <h3 className="font-bold">{beat.title}</h3>
          <p className="text-sm text-chalk-300 mt-1">{beat.detail}</p>
          <p className="text-xs text-chalk-500 mt-3 italic">{stakes}</p>
        </Card>

        {/* pending: coach request */}
        {career.coachRequest && career.coachRequest.honored === null && (
          <Card className="border-calm-500/50">
            <SectionTitle>The coach wants a word</SectionTitle>
            <p className="text-sm text-chalk-300">{career.coachRequest.reason.headline}</p>
            <div className="flex gap-2 mt-3">
              <Btn className="flex-1" onClick={() => act({ type: 'resolveCoachRequest', accept: true })}>Do as he asks</Btn>
              <Btn kind="ghost" className="flex-1" onClick={() => act({ type: 'resolveCoachRequest', accept: false })}>Back your own plan</Btn>
            </div>
          </Card>
        )}

        {/* inbox */}
        {career.inbox.map((e) => {
          const def = EVENT_BY_ID[e.eventId];
          if (!def) return null;
          return (
            <Card key={e.eventId} className="border-flood-500/50" onClick={() => setInboxOpen(e.eventId)}>
              <SectionTitle>Waiting on you</SectionTitle>
              <h4 className="font-semibold text-sm">{def.title}</h4>
              <p className="text-xs text-chalk-500 mt-1">{def.prompt}</p>
            </Card>
          );
        })}

        {/* training */}
        <Card>
          <SectionTitle>This week’s training</SectionTitle>
          <div className="space-y-2">
            {(['primary', 'secondary'] as const).map((which) => (
              <div key={which} className="flex items-center gap-2">
                <span className="w-20 text-xs text-chalk-500">{which === 'primary' ? 'Focus 70%' : 'Focus 30%'}</span>
                <div className="flex flex-1 gap-1">
                  {BLOCKS.map((b) => (
                    <button key={b} onClick={() => setBlock(which, b)}
                      className={`flex-1 rounded-md py-1.5 text-xs ${training[which] === b ? 'bg-pitch-500 text-white' : 'bg-pitch-800 text-chalk-500'}`}>
                      {BLOCK_LABEL[b]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-20 text-xs text-chalk-500">Intensity</span>
              <div className="flex flex-1 gap-1">
                {INTENSITIES.map((i) => (
                  <button key={i} onClick={() => act({ type: 'setTraining', plan: { ...training, intensity: i } })}
                    className={`flex-1 rounded-md py-1.5 text-xs capitalize ${training.intensity === i ? 'bg-pitch-500 text-white' : 'bg-pitch-800 text-chalk-500'}`}>
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {weekKind === 'league' && training.intensity === 'intensive' && you.readiness < 60 && (
            <p className="text-xs text-alert-500 mt-2">Pushing intensive into a match week on tired legs — risky.</p>
          )}
        </Card>

        {/* ambitions strip */}
        {ambs.length > 0 && (
          <Card>
            <SectionTitle>Your ambitions</SectionTitle>
            <div className="space-y-2">
              {ambs.map(({ active, def }) => (
                <div key={def.id}>
                  <div className="flex justify-between text-xs">
                    <span className="text-chalk-300">{def.title}</span>
                    <span className="text-chalk-500">{Math.round(active.progress * 100)}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-pitch-800 mt-1 overflow-hidden">
                    <div className="h-full bg-flood-500 rounded-full" style={{ width: `${active.progress * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* advance */}
        <div className="flex gap-2 pt-1">
          <Btn kind="gold" className="flex-1" onClick={advance}>
            {weekKind === 'league' ? 'Play the week' : 'Advance the week'}
          </Btn>
          <Btn kind="ghost" className="flex-1" onClick={continueToBeat}>Continue ⏩<span className="block text-[10px] opacity-70">to the next beat</span></Btn>
        </div>
      </div>

      {openEvent && (
        <EventModal
          def={openEvent}
          onChoose={(i) => { act({ type: 'resolveInboxEvent', eventId: openEvent.id, choiceIndex: i }); setInboxOpen(null); }}
        />
      )}
      <BottomNav />
    </div>
  );
}

export function HubReasonPeek() {
  const career = useStore((s) => s.career);
  if (!career?.lastReports[0]) return null;
  return <ReasonBlock reason={career.lastReports[0].training.reason} />;
}
