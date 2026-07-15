// The match feed: beats reveal one at a time; the scoreboard climbs only from
// revealed beats; hard stops (debut, sub-on) demand a tap. Temporal honesty
// is the engine's — this screen just refuses to peek ahead.
import { useEffect, useRef, useState } from 'react';
import { useStore } from '@state/store';
import { Btn } from '../bits';

const BEAT_MS = 950;

export function Match() {
  const career = useStore((s) => s.career);
  const report = useStore((s) => s.report);
  const finish = useStore((s) => s.finishMatchView);
  const [revealed, setRevealed] = useState(1);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const match = report?.match;

  useEffect(() => {
    if (!match) return;
    timer.current = setInterval(() => {
      setRevealed((r) => {
        if (paused) return r;
        if (r >= match.beats.length) return r;
        const next = match.beats[r];
        if (next.hardStop) {
          setPaused(true);
          return r + 1;
        }
        return r + 1;
      });
    }, BEAT_MS);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [match, paused]);

  if (!career || !match) return null;
  const beats = match.beats.slice(0, revealed);

  // scoreboard from revealed beats ONLY
  let ours = 0, theirs = 0, minute = 0;
  let liveRating = 6.0;
  for (const b of beats) {
    if (b.kind === 'your_goal' || b.kind === 'team_goal') ours++;
    if (b.kind === 'opp_goal') theirs++;
    if (b.ratingDelta) liveRating += b.ratingDelta;
    minute = b.minute;
  }
  const done = revealed >= match.beats.length;
  const watching = match.involvement === 'bench' || match.involvement === 'out';

  const skip = () => {
    // fast-forward up to the next hard stop, never past it
    let r = revealed;
    while (r < match.beats.length && !match.beats[r].hardStop) r++;
    if (r < match.beats.length) { setRevealed(r + 1); setPaused(true); }
    else setRevealed(match.beats.length);
  };

  return (
    <div className="flex h-full flex-col max-w-md mx-auto">
      {/* scoreboard */}
      <div className="p-5 pb-3 text-center border-b border-pitch-800">
        <p className="text-[11px] uppercase tracking-[0.18em] text-chalk-500">{minute}′</p>
        <div className="mt-1 flex items-center justify-center gap-4 text-lg font-bold">
          <span className="flex-1 text-right truncate">{match.usLabel}</span>
          <span className="rounded-lg bg-pitch-800 px-3 py-1 tabular-nums">{ours} – {theirs}</span>
          <span className="flex-1 text-left truncate">{match.oppLabel}</span>
        </div>
        {match.rating !== null && (
          <p className="mt-2 text-xs text-chalk-500">
            Your match: <b className={liveRating >= 7 ? 'text-flood-400' : 'text-chalk-100'}>{Math.max(3, Math.min(10, liveRating)).toFixed(1)}</b>
          </p>
        )}
        {watching && <p className="mt-2 text-xs text-chalk-500">You watch from the bench. Your week is the reaction, not the action.</p>}
      </div>

      {/* the feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-2">
        {beats.map((b, i) => (
          <p key={i} className={`text-sm ${beatStyle(b.kind)} ${i === beats.length - 1 ? 'animate-pulse-once' : ''}`}>
            {b.text}
          </p>
        ))}
        {paused && !done && (
          <Btn kind="gold" className="w-full mt-3" onClick={() => setPaused(false)}>This is your moment — go</Btn>
        )}
      </div>

      <div className="p-5 pt-2 flex gap-2 border-t border-pitch-800">
        {!done && <Btn kind="ghost" className="flex-1" onClick={skip}>Skip ahead</Btn>}
        {done && <Btn kind="gold" className="flex-1" onClick={finish}>Full time — continue</Btn>}
      </div>
    </div>
  );
}

function beatStyle(kind: string): string {
  switch (kind) {
    case 'your_goal': return 'text-flood-400 font-bold text-base';
    case 'your_assist': return 'text-flood-400 font-semibold';
    case 'team_goal': return 'text-pitch-400 font-semibold';
    case 'opp_goal': return 'text-alert-500 font-semibold';
    case 'sub_on': return 'text-calm-500 font-semibold';
    case 'decision': return 'text-flood-400';
    case 'error': return 'text-alert-500/80';
    case 'kickoff': case 'fulltime': return 'text-chalk-500 uppercase text-xs tracking-widest';
    default: return 'text-chalk-300';
  }
}
