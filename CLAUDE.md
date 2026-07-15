# Touchline — a footballer's life (this repo is the GAME)

A first-person football career RPG. You ARE the footballer; matches are simulated
and lived through a beat feed. Built fresh from the design canon in `docs/`
(plan of record: `docs/DESIGN_DECISIONS.md`; full briefing: `docs/FABLE5_HANDOFF.md`).
The old prototype lives in the separate reference repo `diegodacal/football-life`.

## Architecture rules (non-negotiable, enforced by tests)
- `src/engine` is PURE TypeScript — no React, no DOM, no wall clock, no
  `Math.random`. `src/engine/invariants.test.ts` scans the source and fails on
  violations. The ONLY randomness is the seeded RNG (`src/engine/rng.ts`);
  the only time is the week index. This is what makes absence unobservable
  (anti-FOMO) and every career reproducible from its seed.
- `src/ui` renders engine state and dispatches actions. `src/state` holds the
  Zustand store + Dexie persistence. No game logic outside the engine.
- Everything is data: tuning in `src/engine/data/*` (constants, trainingConfig,
  lifeConfig), content in `events*.ts` / `ambitions.ts` / `nations.ts`.
- Every meaningful outcome emits a `Reason` (weighted, directional factors,
  plain language). Tests assert no outcome without a populated Reason.
- Temporal honesty: moments are modelled first, consequences derived forward
  (a sub's minutes derive from the come-on minute), beats are ordered and
  revealed on a clock, nothing future-readable before its time. Tested.

## Engine invariants (each has a test — never break)
1. No wall clock / ambient randomness / DOM in `src/engine`.
2. Same seed + same decisions → identical career. `advanceWeek` never mutates
   its input; interactive weeks pause via `needs-life`/`needs-match` and replay
   identically when called again with the decision filled in.
3. **Nationality is fixed at birth.** Transfers change `clubId` only; national
   team selection pools by birth nation over the nation's WORLDWIDE population.
4. Absence is unobservable: no decay, no date-keyed content, autosave on every
   commit, recap derives from persisted state only.

## The product layer (why this is a game, not a sim)
Four nested pull loops (DESIGN_DECISIONS §3): **Next Beat** (hub card + stakes
line), **Ambitions** (player-authored goals, story never power), **Identity**
(archetype chains → epithet), **Legacy** (Records Book, Hall of Fame, Sliding
Doors — replay a seed with different choices). `weekSignal` powers
Continue-to-next-beat; `funTuning.test.ts` holds guardrails (event cadence,
max dead stretch, debut-season minutes, seed divergence).

## The world
12 real nations × 2 divisions × 12 fictional clubs = 288 clubs, ~6.4k
persistent NPCs. Deep tier: your club. Light tier: every other league resolves
weekly. Season: 20 weeks (16 league rounds: 11 RR + top6/bottom6 split);
Global Cup seasons (every 4th) run 24 weeks with a 4-week tournament block.
Transfer windows weeks 10–13 + season boundary; AI market moves ~35
players/window; demographic tick ages/retires/regenerates yearly;
promotion/relegation swaps 2 per nation.

## Commands
- `npm run dev` / `npm run build` / `npm test` / `npm run typecheck`
- Deploy: Vercel (`vercel.json`). PWA: `public/manifest.webmanifest` + `sw.js`.

## Code map
- `engine/types/core.ts` — the whole data model.
- `engine/worldgen.ts` — nations→clubs→rosters→fixtures, prospects, calendars.
- `engine/systems/` — tick (orchestrator), training, selection (incl. the
  development-bench rule), match (temporal honesty lives here), status, life
  (meters + QUIET event competition + drama-debt pity ramp), events data in
  `data/events*.ts`, ambitions, narrator (stakes/digest/next-beat/recap/
  epithet), league, seasonRoll (promotion/relegation + demographic tick),
  transfers (offers/AI market/loans; nationality invariant), nationalTeam
  (merit selection + Global Cup), economy inside life, career (create +
  dispatch + retirement/reflections), reason.
- `state/db.ts` — saves + legacy tables (Dexie). `state/store.ts` — the store.
- `ui/screens/` — Title, Prospect, Ambitions, Hub, Match, Moment, Summary,
  SeasonEnd (+PrologueEnd), Tabs (Team/League/You), CareerEnd, Legacy.

## Milestones
- M0 foundations ✅ · M1 One Season of Pull ✅ · M2 Identity + World Live ✅ ·
  M3 The Long Arc ✅ · M4 Felt & Mobile (PWA, moments, fun harness) ✅ shipped
  in v0.1; ONGOING: content expansion toward 250+ events, presentation polish,
  playtest-driven tuning (all numbers are starting guesses).

## Conventions
TypeScript strict; small tested modules; every tunable in data; conventional
commits; push after every meaningful chunk. When adding events, extend
`data/events*.ts` following the schema — gates/weights/tallies make chains
emerge, never hard-script sequences (except explicit `followupId` chains).
