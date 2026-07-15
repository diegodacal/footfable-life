# ⚽ Touchline — a footballer's life

**Live the whole arc — the academy, the breakthrough, the big move abroad, the
scandal, the legacy — one week at a time. On your schedule, never the clock's.**

Touchline is a first-person football career RPG. You don't manage a club and
you don't twitch-play matches: you *are* the footballer. Set your training,
fight for selection, live your matches through a beat-by-beat feed, make the
choices that decide who you become — and when the career ends, it's enshrined
in your Records Book, and the next life begins.

## The promises this game makes

- **Your time is yours.** The game advances only when you play. No energy
  timers, no daily streaks, no decay while you're away. Vanish for two weeks
  and return to exactly where you left — with a "Previously on your career"
  recap and your next beat waiting.
- **Every outcome explains itself.** Selection, growth, meters, money, events —
  everything carries a plain-language "why."
- **The future is never spoiled.** Matches reveal beat by beat; a debut is a
  hard stop you live through; minutes are a consequence of moments, never a
  pre-decided number.
- **Two-plus ways to win.** The model pro and the magnetic maverick are both
  viable identities that compound — each with its own payoffs and its own way
  to fail. Loyalty, family, wealth and leadership run as deep.
- **A world that's real.** 12 nations, 288 clubs, ~6,400 players who age,
  transfer, retire and regenerate. Move abroad and your birth nation still
  calls you up — on merit, wherever you play. Every 4 seasons: the Global Cup.

## Play

```bash
npm install
npm run dev     # play at localhost:5173
npm test        # 44 engine tests: invariants, temporal honesty, fun guardrails
npm run build   # production build (installable PWA, works offline)
```

Careers autosave to your browser (IndexedDB) every week.

## Design

The design canon lives in [`docs/`](docs/) — start with
[`DESIGN_DECISIONS.md`](docs/DESIGN_DECISIONS.md) (the plan of record: the
engagement model, the world, the milestones) and
[`FABLE5_HANDOFF.md`](docs/FABLE5_HANDOFF.md) (the full briefing this build
grew from). The prototype that preceded this build lives in the reference
repo `diegodacal/football-life`; this is a fresh build, not a port.

Built with Vite + React + TypeScript (strict) + Tailwind; the simulation is a
pure, deterministic, headless-testable TypeScript engine with zero DOM and
zero wall-clock — which is *why* the anti-FOMO promises hold. Engineering
guide: [`CLAUDE.md`](CLAUDE.md).
