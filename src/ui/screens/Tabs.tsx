// The read tabs: Team, League, You. One job per screen; Home is for acting.
import {
  clubById, leagueOf, deriveCharacter, BAND_LABEL, epithet, ATTRIBUTE_LABEL,
  activeAmbitions, ECONOMY, POSITION_LABEL,
  type AttributeId, type MeterId,
} from '@engine/index';
import { useStore } from '@state/store';
import { Card, MeterBar, SectionTitle, StatusChip } from '../bits';
import { BottomNav } from '../components/BottomNav';

export function TeamTab() {
  const career = useStore((s) => s.career)!;
  const players = career.world.players
    .filter((p) => p.clubId === career.clubId && p.squad === 'senior')
    .sort((a, b) => a.position.localeCompare(b.position) || b.ability - a.ability);
  return (
    <div className="pb-24 max-w-md mx-auto p-5">
      <h2 className="text-xl font-bold mb-1">{clubById(career.world, career.clubId).name}</h2>
      <p className="text-xs text-chalk-500 mb-4">Your dressing room — and your competition.</p>
      <Card>
        <table className="w-full text-xs">
          <thead className="text-chalk-500">
            <tr className="text-left"><th className="py-1">Player</th><th>Pos</th><th>Age</th><th className="text-right">Form</th></tr>
          </thead>
          <tbody>
            {players.map((p) => {
              const isRival = p.position === career.you.position;
              return (
                <tr key={p.id} className={isRival ? 'text-chalk-100' : 'text-chalk-500'}>
                  <td className="py-1">{p.name}{isRival ? ' ⚔' : ''}</td>
                  <td>{p.position}</td><td>{p.age}</td>
                  <td className="text-right tabular-nums">{p.form.toFixed(1)}</td>
                </tr>
              );
            })}
            <tr className="text-flood-400 font-semibold border-t border-pitch-800">
              <td className="py-1">{career.you.name} (you)</td>
              <td>{career.you.position}</td><td>{career.you.age}</td>
              <td className="text-right tabular-nums">{career.you.form.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10px] text-chalk-500 mt-2">⚔ = fighting for your position</p>
      </Card>
      <BottomNav />
    </div>
  );
}

export function LeagueTab() {
  const career = useStore((s) => s.career)!;
  if (career.phase === 'prologue') {
    return (
      <div className="pb-24 max-w-md mx-auto p-5">
        <h2 className="text-xl font-bold mb-4">The league</h2>
        <Card><p className="text-sm text-chalk-500">Youth football has no table worth reading. Earn the call-up — then the league is yours to climb.</p></Card>
        <BottomNav />
      </div>
    );
  }
  const league = leagueOf(career.world, career.clubId);
  return (
    <div className="pb-24 max-w-md mx-auto p-5">
      <h2 className="text-xl font-bold mb-1">{career.world.nations.find((n) => n.id === league.nationId)?.leagueName}</h2>
      <p className="text-xs text-chalk-500 mb-4">Division {league.division} · 11 rounds, then the split: top six race for the title.</p>
      <Card>
        <table className="w-full text-xs tabular-nums">
          <thead className="text-chalk-500">
            <tr className="text-left"><th className="py-1">#</th><th>Club</th><th>P</th><th>GD</th><th className="text-right">Pts</th></tr>
          </thead>
          <tbody>
            {league.table.map((r, i) => {
              const mine = r.clubId === career.clubId;
              return (
                <tr key={r.clubId} className={`${mine ? 'text-flood-400 font-semibold' : i < 6 ? 'text-chalk-100' : 'text-chalk-500'} ${i === 5 ? 'border-b border-pitch-700' : ''}`}>
                  <td className="py-1">{i + 1}</td>
                  <td>{clubById(career.world, r.clubId).name}</td>
                  <td>{r.played}</td><td>{r.gf - r.ga}</td>
                  <td className="text-right">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <BottomNav />
    </div>
  );
}

const METERS: MeterId[] = ['professionalism', 'lifestyle', 'morale', 'reputation', 'finances', 'family'];

export function PlayerTab() {
  const career = useStore((s) => s.career)!;
  const { you } = career;
  const char = deriveCharacter(career);
  const ambs = activeAmbitions(career);
  const avg = you.season.ratingCount ? (you.season.ratingSum / you.season.ratingCount).toFixed(1) : '—';
  return (
    <div className="pb-24 max-w-md mx-auto p-5 space-y-4">
      <header>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{you.name}</h2>
          <StatusChip status={you.status} />
        </div>
        <p className="text-xs text-chalk-500 mt-0.5">
          {POSITION_LABEL[you.position]} · {you.age} · “{epithet(career)}”
        </p>
      </header>

      <Card>
        <SectionTitle>Season</SectionTitle>
        <div className="grid grid-cols-4 gap-2 text-center">
          <Stat label="Apps" v={you.season.apps} />
          <Stat label="Goals" v={you.season.goals} />
          <Stat label="Assists" v={you.season.assists} />
          <Stat label="Avg" v={avg} />
        </div>
        {career.phase === 'senior' && (
          <p className="text-[10px] text-chalk-500 mt-2">Career: {you.career.apps} apps · {you.career.goals} goals · {you.career.assists} assists</p>
        )}
      </Card>

      <Card>
        <SectionTitle>Attributes <span className="normal-case tracking-normal">· potential: {you.potentialBand}</span></SectionTitle>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {(Object.keys(you.attributes) as AttributeId[]).map((a) => (
            <div key={a} className="flex justify-between text-xs">
              <span className="text-chalk-500">{ATTRIBUTE_LABEL[a]}</span>
              <span className="tabular-nums font-semibold">{you.attributes[a].toFixed(1)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Life</SectionTitle>
        <div className="space-y-2">
          {METERS.map((m) => <MeterBar key={m} meter={m} value={you.meters[m]} />)}
        </div>
        <p className="text-xs text-chalk-500 mt-3">
          Character: <b className="text-chalk-100">{BAND_LABEL[char.band]}</b> ({char.value}) — how the world reads your conduct. It shapes which doors open.
        </p>
      </Card>

      <Card>
        <SectionTitle>Money</SectionTitle>
        <p className="text-sm">Balance <b className="tabular-nums">€{(you.cash * ECONOMY.moneyUnit / 1000).toFixed(0)}k</b>
          <span className="text-chalk-500 text-xs"> · wage €{(you.weeklyWage * ECONOMY.moneyUnit / 1000).toFixed(0)}k/w</span></p>
        {you.cash < 0 && <p className="text-xs text-alert-500 mt-1">You are in debt. It drags on morale until it’s cleared.</p>}
      </Card>

      {ambs.length > 0 && (
        <Card>
          <SectionTitle>Ambitions</SectionTitle>
          {ambs.map(({ active, def }) => (
            <p key={def.id} className="text-xs text-chalk-300 mb-1">{def.title} — <span className="text-chalk-500">{Math.round(active.progress * 100)}%</span></p>
          ))}
        </Card>
      )}

      <Card>
        <SectionTitle>The story so far</SectionTitle>
        {career.milestones.slice(-8).reverse().map((m) => (
          <p key={m.id} className="text-xs text-chalk-300 mb-1">
            <span className="text-chalk-500">S{m.season} W{m.week}</span> — {m.title}
          </p>
        ))}
      </Card>
      <BottomNav />
    </div>
  );
}

function Stat({ label, v }: { label: string; v: number | string }) {
  return (
    <div>
      <p className="text-lg font-bold tabular-nums">{v}</p>
      <p className="text-[10px] text-chalk-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}
