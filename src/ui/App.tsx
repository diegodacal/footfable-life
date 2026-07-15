// The shell: routes screens, hosts the global overlays (recap on return,
// life-event interrupts, in-match decisions). Renders engine state only.
import { useEffect } from 'react';
import { useStore } from '@state/store';
import { Title } from './screens/Title';
import { Prospect } from './screens/Prospect';
import { Ambitions } from './screens/Ambitions';
import { Hub } from './screens/Hub';
import { Match } from './screens/Match';
import { Summary } from './screens/Summary';
import { SeasonEnd, PrologueEnd } from './screens/SeasonEnd';
import { TeamTab, LeagueTab, PlayerTab } from './screens/Tabs';
import { CareerEnd } from './screens/CareerEnd';
import { Legacy } from './screens/Legacy';
import { EventModal } from './components/EventModal';
import { Btn, Modal } from './bits';

export function App() {
  const booted = useStore((s) => s.booted);
  const boot = useStore((s) => s.boot);
  const route = useStore((s) => s.route);
  const recap = useStore((s) => s.recap);
  const dismissRecap = useStore((s) => s.dismissRecap);
  const pendingLife = useStore((s) => s.pendingLife);
  const pendingMatch = useStore((s) => s.pendingMatch);
  const answerLife = useStore((s) => s.answerLife);
  const answerMatch = useStore((s) => s.answerMatch);

  useEffect(() => { void boot(); }, [boot]);

  if (!booted) {
    return <div className="flex h-full items-center justify-center text-chalk-500 text-sm">Lacing up…</div>;
  }

  return (
    <div className="h-full">
      {route === 'title' && <Title />}
      {route === 'prospect' && <Prospect />}
      {route === 'ambitions' && <Ambitions />}
      {route === 'hub' && <Hub />}
      {route === 'match' && <Match />}
      {route === 'summary' && <Summary />}
      {route === 'seasonEnd' && <SeasonEnd />}
      {route === 'prologueEnd' && <PrologueEnd />}
      {route === 'team' && <TeamTab />}
      {route === 'league' && <LeagueTab />}
      {route === 'player' && <PlayerTab />}
      {route === 'careerEnd' && <CareerEnd />}
      {route === 'legacy' && <Legacy />}

      {/* "Previously on your career" — shown once after time away */}
      {recap && (
        <Modal>
          <p className="text-[11px] uppercase tracking-[0.18em] text-flood-400">Previously, on your career</p>
          <h3 className="text-lg font-bold mt-2">{recap.where}</h3>
          {recap.recently.length > 0 && (
            <ul className="mt-3 space-y-1">
              {recap.recently.map((r, i) => <li key={i} className="text-xs text-chalk-300">{r}</li>)}
            </ul>
          )}
          <div className="mt-4 rounded-lg bg-pitch-800 p-3">
            <p className="text-[10px] uppercase tracking-widest text-chalk-500">Next beat</p>
            <p className="text-sm font-semibold mt-1">{recap.next.title}</p>
            <p className="text-xs text-chalk-500">{recap.next.detail}</p>
          </div>
          <Btn kind="gold" className="w-full mt-4" onClick={dismissRecap}>Pick it back up</Btn>
        </Modal>
      )}

      {/* a life interrupt pauses the week */}
      {pendingLife && (
        <EventModal def={pendingLife.event} why={pendingLife.reason} onChoose={answerLife} />
      )}

      {/* an in-match decision pauses the week */}
      {pendingMatch && (
        <Modal>
          <p className="text-[11px] uppercase tracking-[0.18em] text-flood-400">{pendingMatch.minute}′ — the moment finds you</p>
          <h3 className="text-lg font-bold mt-2">{pendingMatch.decision.prompt}</h3>
          <div className="mt-4 space-y-2">
            {pendingMatch.decision.options.map((o, i) => (
              <Btn key={i} kind={i === 0 ? 'gold' : 'ghost'} className="w-full" onClick={() => answerMatch(i)}>{o}</Btn>
            ))}
          </div>
          <p className="text-[10px] text-chalk-500 mt-3">You’ll live the match knowing only what you chose — not how it ends.</p>
        </Modal>
      )}
    </div>
  );
}
