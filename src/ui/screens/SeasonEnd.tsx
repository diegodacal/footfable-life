// Season finale + the prologue call-up moment. Bank the chapter, tee the next.
import { AMBITION_BY_ID, clubById } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card, SectionTitle } from '../bits';

export function SeasonEnd() {
  const career = useStore((s) => s.career);
  const setRoute = useStore((s) => s.setRoute);
  if (!career) return null;
  const club = clubById(career.world, career.clubId);
  const closed = career.season - 1;
  const seasonMs = career.milestones.filter((m) => m.season === closed);
  const verdicts = career.ambitions.filter((a) => a.status !== 'active' && a.verdictReason);

  return (
    <div className="p-5 pb-10 max-w-md mx-auto space-y-4">
      <header className="pt-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-flood-400">Season {closed} — full time</p>
        <h2 className="text-2xl font-black mt-2">The chapter closes.</h2>
        <p className="text-sm text-chalk-500 mt-1">{club.name}</p>
      </header>

      {seasonMs.some((m) => m.kind === 'trophy') && (
        <Card className="border-flood-400 text-center bg-gradient-to-br from-pitch-800 to-pitch-900">
          <p className="text-3xl">🏆</p>
          <p className="font-black text-flood-400 text-lg mt-1">CHAMPIONS</p>
        </Card>
      )}

      <Card>
        <SectionTitle>The season in numbers</SectionTitle>
        {seasonMs.filter((m) => m.kind === 'season').map((m) => (
          <p key={m.id} className="text-sm text-chalk-300">{m.detail}</p>
        ))}
      </Card>

      {verdicts.length > 0 && (
        <Card>
          <SectionTitle>Your ambitions — the verdicts</SectionTitle>
          {verdicts.map((a) => {
            const def = AMBITION_BY_ID[a.defId];
            if (!def) return null;
            return (
              <div key={a.defId} className="mb-2">
                <p className={`text-sm font-semibold ${a.status === 'completed' ? 'text-pitch-400' : a.status === 'failed' ? 'text-alert-500' : 'text-chalk-500'}`}>
                  {a.status === 'completed' ? '✓' : a.status === 'failed' ? '✗' : '—'} {def.title}
                </p>
                {a.verdictReason && <p className="text-xs text-chalk-500">{a.verdictReason.headline}</p>}
              </div>
            );
          })}
        </Card>
      )}

      <Card>
        <SectionTitle>Moments you’ll remember</SectionTitle>
        {seasonMs.filter((m) => ['debut', 'first_goal', 'first_assist', 'status', 'trophy', 'callup', 'injury'].includes(m.kind)).slice(0, 6).map((m) => (
          <p key={m.id} className="text-xs text-chalk-300">W{m.week} — {m.title}</p>
        ))}
      </Card>

      <Btn kind="gold" className="w-full" onClick={() => setRoute('ambitions')}>
        Season {career.season} — set your sights
      </Btn>
    </div>
  );
}

export function PrologueEnd() {
  const career = useStore((s) => s.career);
  const setRoute = useStore((s) => s.setRoute);
  if (!career) return null;
  const club = clubById(career.world, career.clubId);
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <p className="text-[11px] uppercase tracking-[0.3em] text-flood-400">The gaffer’s office</p>
      <h2 className="text-3xl font-black mt-3 leading-tight">“Get changed with the first team on Monday.”</h2>
      <p className="text-sm text-chalk-300 mt-4 max-w-xs">
        The academy year is over. {club.name} are moving you up — a professional contract is on the table, and the real story starts now.
      </p>
      <p className="text-xs text-chalk-500 mt-3">Youth football taught you the loop: train, fight for selection, take your moments. From here, everything counts.</p>
      <Btn kind="gold" className="mt-8 w-full max-w-xs" onClick={() => setRoute('ambitions')}>
        Sign in the morning — choose what you’re chasing
      </Btn>
    </div>
  );
}
