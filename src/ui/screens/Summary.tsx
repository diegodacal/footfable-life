// Land the consequences of the week: result, growth, meters, milestones, money.
import { describeReason } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card, SectionTitle, ReasonBlock } from '../bits';

export function Summary() {
  const career = useStore((s) => s.career);
  const report = useStore((s) => s.report);
  const digests = useStore((s) => s.digests);
  const finish = useStore((s) => s.finishSummary);
  if (!career || !report) return null;
  const m = report.match;
  const home = m ? m.fixture.homeId === career.clubId : false;

  return (
    <div className="p-5 pb-10 max-w-md mx-auto space-y-4">
      <header className="pt-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-chalk-500">
          {report.season === 0 ? 'Youth season' : `Season ${report.season}`} · Week {report.week}
        </p>
        <h2 className="text-xl font-bold mt-1">The week lands.</h2>
      </header>

      {digests.length > 0 && (
        <Card>
          <SectionTitle>The weeks between — in fast-forward</SectionTitle>
          {digests.map((d, i) => <p key={i} className="text-xs text-chalk-500">{d}</p>)}
        </Card>
      )}

      {m && (
        <Card>
          <SectionTitle>Matchday</SectionTitle>
          <p className="text-lg font-bold">
            {home ? m.fixture.homeGoals : m.fixture.awayGoals} – {home ? m.fixture.awayGoals : m.fixture.homeGoals}
            {m.rating !== null && <span className="ml-3 text-flood-400 text-base">you: {m.rating.toFixed(1)}</span>}
          </p>
          <p className="text-xs text-chalk-500 mt-1">
            {m.minutes > 0 ? `${m.minutes} minutes${m.goals ? ` · ${m.goals} goal${m.goals > 1 ? 's' : ''}` : ''}${m.assists ? ` · ${m.assists} assist${m.assists > 1 ? 's' : ''}` : ''}` : 'No minutes this week.'}
          </p>
          <ReasonBlock reason={m.selectionReason} />
        </Card>
      )}

      <Card>
        <SectionTitle>Development</SectionTitle>
        {report.training.lines.length === 0 && <p className="text-xs text-chalk-500">Quiet, steady work.</p>}
        {report.training.lines.map((l, i) => <p key={i} className="text-xs text-chalk-300">{l}</p>)}
        <p className="text-xs text-chalk-500 mt-2">{report.training.readinessLine}</p>
      </Card>

      {report.life.moves.length > 0 && (
        <Card>
          <SectionTitle>Life this week</SectionTitle>
          <div className="space-y-1">
            {dedupeMoves(report.life.moves).map((mv, i) => (
              <p key={i} className="text-xs">
                <span className={mv.delta > 0 ? 'text-pitch-400' : 'text-alert-500'}>
                  {mv.meter} {mv.delta > 0 ? '+' : ''}{mv.delta.toFixed(1)}
                </span>{' '}
                <span className="text-chalk-500">— {mv.why}</span>
              </p>
            ))}
          </div>
          <p className="text-xs text-chalk-500 mt-2">
            Money: +{report.life.ledger.wage} wage, −{report.life.ledger.upkeep} living · balance {career.you.cash.toFixed(0)}
          </p>
        </Card>
      )}

      {report.milestones.length > 0 && (
        <Card className="border-flood-500/60 bg-gradient-to-br from-pitch-900 to-pitch-800">
          <SectionTitle>Moments</SectionTitle>
          {report.milestones.map((ms) => (
            <div key={ms.id} className="mb-2">
              <p className="font-bold text-flood-400">{ms.title}</p>
              <p className="text-xs text-chalk-300">{ms.detail}</p>
            </div>
          ))}
        </Card>
      )}

      {report.statusChange && (
        <Card>
          <SectionTitle>Standing</SectionTitle>
          <p className="text-sm font-semibold">{report.statusChange.from} → {report.statusChange.to}</p>
          <p className="text-xs text-chalk-500 mt-1">{describeReason(report.statusChange.reason)}</p>
        </Card>
      )}

      <Btn kind="gold" className="w-full" onClick={finish}>
        {report.prologueComplete ? 'The verdict…' : report.seasonComplete ? 'Close the season' : 'Back to the week'}
      </Btn>
    </div>
  );
}

interface MoveLine { meter: string; delta: number; why: string }
function dedupeMoves(moves: Array<{ meter: string; delta: number; reason: { headline: string } }>): MoveLine[] {
  const map = new Map<string, MoveLine>();
  for (const m of moves) {
    const key = `${m.meter}:${m.reason.headline}`;
    const ex = map.get(key);
    if (ex) ex.delta += m.delta;
    else map.set(key, { meter: cap(m.meter), delta: m.delta, why: m.reason.headline });
  }
  return [...map.values()].filter((m) => Math.abs(m.delta) >= 0.5);
}
function cap(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }
