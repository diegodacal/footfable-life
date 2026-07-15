// Small shared UI pieces. Pure presentation.
import type { ReactNode } from 'react';
import type { MeterId, Reason } from '@engine/index';
import { METER_LABEL } from '@engine/index';

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-xl bg-pitch-900/90 border border-pitch-700/60 p-4 ${onClick ? 'cursor-pointer active:scale-[0.99] transition' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, kind = 'primary', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; kind?: 'primary' | 'ghost' | 'gold'; className?: string; disabled?: boolean;
}) {
  const styles =
    kind === 'primary' ? 'bg-pitch-500 hover:bg-pitch-400 text-white' :
    kind === 'gold' ? 'bg-flood-500 hover:bg-flood-400 text-pitch-950 font-semibold' :
    'bg-transparent border border-pitch-700 text-chalk-300 hover:border-pitch-500';
  return (
    <button disabled={disabled} onClick={onClick}
      className={`rounded-lg px-4 py-3 text-sm font-medium transition disabled:opacity-40 disabled:pointer-events-none ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[11px] uppercase tracking-[0.18em] text-chalk-500 mb-2">{children}</h3>;
}

const METER_COLORS: Record<string, string> = {
  professionalism: 'bg-calm-500', lifestyle: 'bg-flood-500', morale: 'bg-pitch-400',
  reputation: 'bg-purple-400', finances: 'bg-emerald-400', family: 'bg-rose-400',
};

export function MeterBar({ meter, value }: { meter: MeterId; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-chalk-300">{METER_LABEL[meter]}</span>
        <span className="text-chalk-500">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-pitch-800 overflow-hidden">
        <div className={`h-full rounded-full ${METER_COLORS[meter]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ReasonBlock({ reason }: { reason: Reason }) {
  return (
    <div className="text-xs text-chalk-500 mt-1">
      <p className="text-chalk-300">{reason.headline}</p>
      <ul className="mt-0.5 space-y-0.5">
        {reason.factors.map((f, i) => (
          <li key={i}>
            <span className={f.dir === 'up' ? 'text-pitch-400' : f.dir === 'down' ? 'text-alert-500' : 'text-chalk-500'}>
              {f.dir === 'up' ? '▲' : f.dir === 'down' ? '▼' : '•'}
            </span>{' '}
            {f.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Modal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-pitch-900 border border-pitch-700 p-5 max-h-[85vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const color = status === 'Star' ? 'bg-flood-500 text-pitch-950' : status === 'Regular' ? 'bg-pitch-400 text-pitch-950' : 'bg-pitch-700 text-chalk-100';
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>{status}</span>;
}
