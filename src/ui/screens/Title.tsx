import { useStore } from '@state/store';
import { Btn } from '../bits';

export function Title() {
  const setRoute = useStore((s) => s.setRoute);
  const career = useStore((s) => s.career);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-6 text-center">
      <div>
        <p className="text-flood-400 text-xs uppercase tracking-[0.3em] mb-3">a footballer’s life</p>
        <h1 className="text-5xl font-black tracking-tight">TOUCHLINE</h1>
        <p className="mt-3 text-chalk-500 max-w-xs mx-auto text-sm">
          Live the whole arc — the academy, the breakthrough, the big move, the legacy. One week at a time. On your time.
        </p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {career && <Btn kind="gold" onClick={() => setRoute('hub')}>Continue your career</Btn>}
        <Btn onClick={() => setRoute('prospect')}>{career ? 'Start a new career' : 'Begin your career'}</Btn>
      </div>
    </div>
  );
}
