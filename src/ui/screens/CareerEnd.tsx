// The career's final screen: the whole life, banked. Retirement is a
// ceremony; broke is a cautionary tale. Both are ENDINGS — which is the point.
import { epithet, NATION_BY_ID, POSITION_LABEL } from '@engine/index';
import { useStore } from '@state/store';
import { Btn, Card, SectionTitle } from '../bits';

export function CareerEnd() {
  const career = useStore((s) => s.career);
  const ack = useStore((s) => s.endCareerAcknowledged);
  if (!career) return null;
  const { you } = career;
  const broke = career.endedReason === 'broke';
  const trophies = career.milestones.filter((m) => m.kind === 'trophy');
  const reflections = career.milestones.filter((m) => m.kind === 'retirement' && !['The final whistle', 'Broke', 'Retired, on your own terms'].includes(m.title));
  const defining = career.milestones.filter((m) => ['debut', 'first_goal', 'transfer', 'callup', 'trophy'].includes(m.kind));

  return (
    <div className="p-5 pb-10 max-w-md mx-auto space-y-4">
      <header className="pt-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-flood-400">
          {broke ? 'The cautionary tale' : 'The final whistle'}
        </p>
        <h2 className="text-3xl font-black mt-2">{you.name}</h2>
        <p className="text-sm text-chalk-500 mt-1">
          {NATION_BY_ID[you.nationId].name} · {POSITION_LABEL[you.position]} · “{epithet(career)}”
        </p>
        <p className="text-sm text-chalk-300 mt-4 max-w-xs mx-auto">
          {broke
            ? 'The money ran out before the talent did. Every career is a story — this one ends as a warning, and warnings are remembered too.'
            : `${you.career.seasons} seasons. A whole life lived one week at a time — and you chose how it ended.`}
        </p>
      </header>

      <Card>
        <SectionTitle>The career in numbers</SectionTitle>
        <div className="grid grid-cols-4 gap-2 text-center">
          <NumStat label="Seasons" v={you.career.seasons} />
          <NumStat label="Apps" v={you.career.apps} />
          <NumStat label="Goals" v={you.career.goals} />
          <NumStat label="Assists" v={you.career.assists} />
        </div>
      </Card>

      {trophies.length > 0 && (
        <Card className="border-flood-400">
          <SectionTitle>Honours</SectionTitle>
          {trophies.map((t) => <p key={t.id} className="text-sm font-semibold text-flood-400">🏆 {t.title} <span className="text-chalk-500 font-normal">S{t.season}</span></p>)}
        </Card>
      )}

      {reflections.length > 0 && (
        <Card>
          <SectionTitle>Looking back</SectionTitle>
          {reflections.map((r) => (
            <div key={r.id} className="mb-3">
              <p className="text-sm font-semibold text-chalk-100">{r.title}</p>
              <p className="text-xs text-chalk-500 mt-0.5 italic">{r.detail}</p>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <SectionTitle>The moments that made it</SectionTitle>
        {defining.slice(-10).map((m) => (
          <p key={m.id} className="text-xs text-chalk-300 mb-1"><span className="text-chalk-500">S{m.season}</span> — {m.title}</p>
        ))}
      </Card>

      <Btn kind="gold" className="w-full" onClick={ack}>Enter the Records Book</Btn>
    </div>
  );
}

function NumStat({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <p className="text-xl font-bold tabular-nums">{v}</p>
      <p className="text-[10px] text-chalk-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
