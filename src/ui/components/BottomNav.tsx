import { useStore, type Route } from '@state/store';

const TABS: Array<{ route: Route; label: string; icon: string }> = [
  { route: 'hub', label: 'Home', icon: '⚽' },
  { route: 'team', label: 'Team', icon: '👥' },
  { route: 'league', label: 'League', icon: '🏆' },
  { route: 'player', label: 'You', icon: '🧍' },
];

export function BottomNav() {
  const route = useStore((s) => s.route);
  const setRoute = useStore((s) => s.setRoute);
  const career = useStore((s) => s.career);
  const pendingCount = (career?.inbox.length ?? 0) + (career?.coachRequest && career.coachRequest.honored === null ? 1 : 0);
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-pitch-800 bg-pitch-950/95 backdrop-blur">
      <div className="mx-auto max-w-md grid grid-cols-4">
        {TABS.map((t) => (
          <button key={t.route} onClick={() => setRoute(t.route)}
            className={`relative py-3 text-xs flex flex-col items-center gap-0.5 ${route === t.route ? 'text-flood-400' : 'text-chalk-500'}`}>
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
            {t.route === 'hub' && pendingCount > 0 && (
              <span className="absolute top-1.5 right-[28%] h-2 w-2 rounded-full bg-alert-500" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
