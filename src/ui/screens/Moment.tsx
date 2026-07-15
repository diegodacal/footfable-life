// A moment screen: one big beat, full screen, felt. These are the memories.
import type { Milestone } from '@engine/index';
import { useStore } from '@state/store';
import { Btn } from '../bits';

const MOMENT_ART: Record<string, { icon: string; kicker: string }> = {
  debut: { icon: '🌟', kicker: 'The day it became real' },
  first_goal: { icon: '⚽', kicker: 'The one you never forget' },
  first_assist: { icon: '🎯', kicker: 'Unselfish, decisive' },
  callup: { icon: '🇺🇳', kicker: 'Your country calls' },
  trophy: { icon: '🏆', kicker: 'Silverware' },
  transfer: { icon: '✈️', kicker: 'A new chapter' },
  status: { icon: '📈', kicker: 'Climbing' },
  retirement: { icon: '🌅', kicker: 'The last page' },
};

export function Moment({ milestone }: { milestone: Milestone }) {
  const finishMoment = useStore((s) => s.finishMoment);
  const art = MOMENT_ART[milestone.kind] ?? { icon: '✨', kicker: 'A moment' };
  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center max-w-md mx-auto bg-gradient-to-b from-pitch-950 via-pitch-900 to-pitch-950">
      <p className="text-6xl animate-bounce-slow">{art.icon}</p>
      <p className="text-[11px] uppercase tracking-[0.3em] text-flood-400 mt-6">{art.kicker}</p>
      <h2 className="text-3xl font-black mt-3 leading-tight">{milestone.title}</h2>
      <p className="text-sm text-chalk-300 mt-4 max-w-xs">{milestone.detail}</p>
      <Btn kind="gold" className="mt-10 w-full max-w-xs" onClick={finishMoment}>Take it in — continue</Btn>
    </div>
  );
}
