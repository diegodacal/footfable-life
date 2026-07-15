# Touchline — Project Analysis & Handoff to Fable 5

> **Purpose.** This document is a complete, self-contained briefing on the football-career
> RPG we have been building (working title **"Touchline"**). It is written to be handed to
> **Fable 5** as the kick-off point for building a *proper game* — one designed for player
> satisfaction, long-term engagement, and fun — using our accumulated design and code as raw
> material rather than a finished product. It states what the game is, what we built, what
> went well, what fought us (especially **time/pacing**), where the project stands today, and
> what the road ahead looks like. It also profiles **the player** in both senses: the
> *footballer* you control, and the *human* holding the phone.
>
> *Prepared July 2026. Companion to the eleven design docs in `docs/` and `CLAUDE.md`.*

---

## 0. TL;DR

- **What it is:** A single-player, first-person **football career RPG** set in a fictional
  world. *You are the footballer* — you don't play matches on the pitch, you **live a
  career**: train, manage an off-pitch life, move between clubs, and steer relationships from
  youth prospect through prime, decline, and retirement. Matches are **simulated and watched**,
  not controlled.
- **The core fantasy:** development under pressure. A gifted player who trains badly, trusts
  the wrong agent, or loses the coach's favour can stall; discipline and smart relationships
  can carry a modest talent further than expected. *Every outcome explains itself.*
- **What exists:** A working web beta. A **pure-TypeScript simulation engine** (~11,400 LOC over
  25 systems, **188 tests** across 23 suites, fully deterministic) wrapped by a **React/Tailwind UI**
  (~3,400 LOC). It plays: pick a prospect → weekly training → animated match feed with rare
  in-match decisions → six-meter off-pitch life → **71 authored life events** with compounding
  archetype chains → transfers, loans, cups, and national teams → season-end and career-end.
- **Design maturity:** Very high. Eleven detailed, internally-reconciled design docs. The
  *systems* are thought through to a level most prototypes never reach.
- **Product maturity:** Medium. It is a systems sandbox that *works*, but it has **no
  persistence** (saves don't survive reload), **no onboarding**, thin presentation in places,
  and has never been balance-tuned or player-tested for **fun and retention**.
- **The headline challenge — and our proudest solve:** making the game unfold in **human,
  chronological time** — never revealing the future before the present, never spoiling a
  result, deriving consequences *forward* from modelled moments. We built real machinery for
  this (see §7). It is the single most important lesson to carry into a fresh build.
- **The ask of Fable 5:** treat the engine's *systems thinking* and *data-driven design* as
  proven and reusable; treat the *product, presentation, pacing-for-fun, and retention loop* as
  open. Build the game these systems deserve.

---

## 1. The Key Objective of the Game

### 1.1 The pitch
You steer a footballer's whole life around the game — **how you train, the life you build off
the pitch, the clubs you move between, and the people who shape your fate** (chiefly your
**manager/agent** and your **coach**). The tone is **realistic but dramatized**: grounded in how
real careers work, with room for scandals, feuds, and soap-opera arcs.

### 1.2 What makes it different
Most football games are either *management* (you run a club) or *action* (you play the match).
Touchline is neither. It is a **career-and-life RPG** where the unit of play is the **week**,
the protagonist is **one person**, and the drama is **development, relationships, and choice
under pressure**. The closest cousins are text-driven life sims and sports-career story modes —
but with a genuinely simulated world underneath.

### 1.3 The design priorities (ranked, and this order is deliberate)
1. **Player development & training** — the core loop.
2. **Off-pitch life management** — the strong second pillar.
3. **Career / transfer strategy.**
4. **Emergent drama & stories** — a flavour layer, not the main course.

### 1.4 The pillars (the values every decision was measured against)
- **Emergent stories over spreadsheets** — systems should *generate* narratives.
- **Meaningful trade-offs** — every gain has a cost; no obviously-correct choice.
- **Readable systems** — the player always understands *why* something happened.
- **Balanced pacing** — enough to stay engaged, never so much it becomes a chore.
- **Your own goals** — no imposed win condition; you decide what success means.
- **Replayability** — different footballers, clubs, managers, and choices yield different arcs.

### 1.5 The non-negotiables (baked into the architecture)
- **The engine is pure TypeScript** — no React, no DOM, no browser APIs. It runs headless and
  is unit-tested. The UI only *renders* engine state and *dispatches* actions. This is what
  makes the sim testable, tunable, and portable (Capacitor/mobile later).
- **Everything is data, not code.** Attributes, events, tuning, clubs, age curves live in
  `src/engine/data/` as config/JSON so the game can be balanced without touching logic.
- **Career is a first-class engine concept.** A `Game` holds a *list* of careers (length 1 at
  launch); multiple parallel careers is a UI change later, never an engine rewrite.
- **Every outcome emits a `Reason`.** Whenever the engine fires an event, makes a selection,
  resolves a training week, moves a meter, or changes money — it emits a structured, weighted,
  directional *"why"* at the point of decision. The UI renders it as plain language. **Tests
  assert no such outcome occurs without a populated `Reason`.** This is the soul of the game.

---

## 2. The Player — Two Meanings

You asked us to talk about *the player itself*. There are two players, and both matter.

### 2.1 The footballer (the protagonist you control)

The footballer is the **only true point of agency** in the world. Everyone else is an NPC who
*reacts* to you. You rarely command them; you **influence** them.

**How the footballer is modelled:**

- **Eight attributes, on a 1–20 scale** (decimal under the hood), across three programs:
  - *Technical* — **Finishing, Passing, Control**
  - *Physical* — **Pace, Strength, Stamina**
  - *Mental* — **Composure, Positioning**
- **Position is chosen at youth and locked for the career** (Striker / Central Midfielder /
  Centre-back at the slice level). Positions weight the eight attributes differently, so the
  same set produces genuinely distinct player types.
- **Potential is a hidden per-attribute ceiling**, shown only as a coarse *band or hint*, never
  an exact number — you never fully know how good you can get.
- **Two development sources:** attributes grow from **both training and match minutes**. In
  youth (few minutes) training leads; breaking into the first team accelerates growth — creating
  the central trade-off between a *prestige club* and one where you'd *actually play*.
- **A status ladder** gates the whole career: **Youth → Backup → Rotation → Regular → Star**.
  You climb it (and slip down it) on merit — ability vs. squad, form, age.
- **Six off-pitch life meters** (0–100) travel with you: **Professionalism, Lifestyle, Morale,
  Reputation, Finances, Family** (see §4).
- **A derived Character** read (0.40 Reputation + 0.40 Professionalism + 0.20 conduct history),
  banded — *never a seventh meter*, only a weight-multiplier that colours which events fire.
- **A full life arc:** youth prospect → first-team breakthrough → prime → decline →
  **retirement** (or a hard-fail: washing out, going broke, career-ending injury). The player
  character is *exempt from automatic retirement* — their ending is **authored**, two curated
  moments — but they age and decline like everyone else.
- **Lifetime career totals** (apps, goals, assists) and a **milestone timeline** (debut, first
  goal, promotions, life beats) accumulate into a persistent History.

**The footballer's identity is emergent, not chosen from a menu.** Through the event system, a
career compounds toward archetypes — the **Consummate Pro**, the **Magnetic Maverick**, the
**One-Club Legend**, the **Family Anchor**, the **Financial Dynasty**, the **Respected Leader**
— each with its own reward curve and its own way to fail (see §4.3). *No archetype dominates;
each is a viable, distinct identity.* This is the deepest and most novel part of the design.

### 2.2 The user (the human playing)

The design implies — but has never validated — a specific player.

- **Who they are:** a football fan who likes *story and progression* over twitch skill or
  micromanagement. The Football Manager / life-sim / sports-RPG audience. Someone who enjoys
  *watching a career unfold* and *making weighty choices*, not drilling set-pieces.
- **What they want:** the fantasy of *being* a footballer and living the whole arc — the
  breakthrough, the big move, the scandal, the legacy — with real consequences and a clear
  sense of cause and effect.
- **Session shape:** **mobile-first, bite-sized.** The week is the atomic unit. A satisfying
  session is *a few weeks* — set training, watch a match, resolve a decision — in a handful of
  minutes. This is a *commute / couch / before-bed* game, not a marathon.
- **What must keep them coming back (and where the current build is weakest):** a **retention
  loop** — a reason to open the app tomorrow. Right now the game has excellent *moment-to-moment*
  legibility but no *meta-progression*, no *goals framework*, no *saves*, and no *onboarding*.
  A fresh build should treat **longevity and fun** as first-class design targets, not emergent
  properties (see §9 and §10).

---

## 3. What Was Built — Current Status

The project is a **working web beta** that has grown well past its original scope. It is
organised as a strict engine/UI/state split.

### 3.1 The simulation engine (`src/engine/`) — pure TypeScript, headless, tested

**~11,400 LOC · 25 systems · 188 tests across 23 suites · fully deterministic (seeded mulberry32
PRNG) · `ENGINE_VERSION 0.4.0-m5`.** A season is a uniform **30 weeks** (Opening 1–12 / Split
13–24 / Climax 25–30).

The weekly loop is orchestrated by `systems/tick.ts`, which advances one week and produces a
`WeekReport`. The engine exposes a small public API (`@engine/index`) as the *only* surface the
UI and tests import — `createCareer`, `createGame`, `beginWeek`/`resolveWeek` (two-phase
advance), `tick` (headless auto-resolve), `dispatch` (actions), `describeReason`, plus reads and
helpers.

**The systems (each an isolated, tested module in `src/engine/systems/`):**

| System | Role |
|---|---|
| `tick` | Orchestrates the weekly loop: training → selection → match → development → status → injuries → life phase → milestones/timeline → season-end. |
| `training` | The full redesigned model: split 70/30 focus, intensity (Intensive/Balanced/Recover), growth with diminishing returns, per-block age phases, and the §9 "why" readout. |
| `development` | Growth math, readiness, age-phase helpers. Attributes grow from training **and** minutes. |
| `selection` | Merit-based weekly pick (start/sub/benched/left-out) from ability + form vs. positional rivals. |
| `match` | Resolves the team result *and* your individual contribution in one pass; generates the ordered **beat feed**; models sub come-on/come-off minutes (see §7). |
| `status` | The Youth→Backup→Rotation→Regular→Star ladder. |
| `injuries` | Readiness-scaled injury risk; brief knocks plus rare career-enders. |
| `coachRequest` | The coach's periodic "focus this program" requests — accept for standing, refuse for freedom. |
| `lifeMeters` | Weekly drift-to-baseline + the coupling web; the *single* meter writer, always with a `Reason`. |
| `character` | The derived Character read, band, and the band×bias multiplier. |
| `events` | The data-driven event runtime: QUIET-weighted competition, gates, cooldowns, season caps, chains via flags, tallies→status flags, modifiers. |
| `economy` | The finances ledger (wage + sponsor − agent cut − upkeep), agent tiers, debt→broke escalation. |
| `life` | The weekly life phase and discretionary choices (capped 2/week). |
| `reason` | The structured "why" trace and its plain-language rendering. |
| `game` | The Career collection + the (intact but unused) multi-career auto-resolution loop. |
| `calendar` | The season calendar: match/rest/double weeks, transfer windows, chronology. |
| `cup` | Full-field knockout cup, resolved round-by-round in the tick. |
| `league` | League tables and standings. |
| `loans` | The loan pathway (agent-led + coach-led) for youth/backup players short of minutes. |
| `transfers` / `transferRequests` | Transfer windows, AI club economy, player-initiated requests, incoming offers & scouting, free agency. |
| `national` / `nationalTeam` | Pure-merit national-team selection, friendlies on existing weeks, the World Cup analog. |
| `demographics` | The once-a-year world tick: ageing, decline, retirement, youth intake/regen. |
| `world` | The persistent multi-league world scaffolding. |

### 3.2 The data layer (`src/engine/data/`) — the game as tunable config
- `constants.ts` — match/selection/status/rating/squad/calendar TUNE numbers.
- `trainingConfig.ts` — *all* training tunables (attributes×block, intensity table, readiness
  bands, injury params, age phases, growth knobs, coach-request params). No training magic
  numbers live in code.
- `lifeConfig.ts` — *all* off-pitch tunables: meter drift + coupling, Character weights/bands,
  tally→flag conditions, the modifier set, the QUIET scheduler, weekly choices, the 2/week cap.
- `economyConfig.ts` — the money-tier→€ mapping, wage tables, sponsor/upkeep formulas, agent
  costs + affordability gates, debt→broke escalation.
- `events.json` — **71 authored events** (source of truth), built + validated by
  `scripts/build_events.py`. Extend events by editing the builder, never by hand.
- `prospects.ts`, `positions.ts`, `attributes.ts` — deterministic prospect/squad/fixture
  generation, position-weight maps, attribute↔program mapping and starting meters.

### 3.3 The UI (`src/ui/`, `src/state/`) — React + Tailwind, a pure view
- **Zustand store** holds the `Game`; a `commit()` helper mirrors the active career. **No game
  logic in the UI.** Drives the two-phase advance and an in-memory season archive.
- **Screens:** Start (prospect select) · Hub (the week control room) · Match (animated feed +
  interactive decisions) · Summary · SeasonEnd · CareerEnd · and the Team / League / Player /
  People tabs. The **Player tab** is one screen with three views — **Career / Personal Life /
  History** — where PersonalLife is the off-pitch home (six meters with tap-to-see-why, the
  Character spectrum, the finances ledger, family/dependents, capped weekly choices with a
  consequence preview, and a life inbox).
- **Consistent decision markers** (`ui/pending.ts`): every pending decision is flagged both in
  the bottom nav and on its screen, tiered — **red/urgent** for must-decide-now life interrupts,
  **amber/calm** for a waiting coach request or inbox event. One source of truth for both.

### 3.4 Tooling & headless play
- `npm run sim` / `npm run worldsim` — run careers and the world headlessly for balancing and
  debugging (season summaries or week-by-week play-by-play). Deterministic: same seed → same
  career. This is a genuine asset — the sim can be *tuned without the UI*.
- Vite + Vitest + TypeScript strict; deploy config for Vercel.

### 3.5 Milestones delivered
- **M0** — Setup (engine/UI/state split, stubs, CI, deploy). ✅
- **M1** — Engine core (weekly loop, deterministic RNG, full headless seasons). ✅
- **M2** — UI shell / first playable beta (prospect → hub → match feed → tabs → season end). ✅
- **Training redesign + single-career scope** — readiness bands, growth/diminishing returns,
  age phases, coach requests; the engine-level `Reason` trace. ✅
- **M4** — Life system + economy (six meters, the data-driven event runtime over `events.json`,
  archetype chains, the consequence economy, the Personal Life tab). ✅
- **Beyond the plan** — calendar/competitions/cups, loans, a persistent 12-league world with a
  demographic tick, transfers & free agency, national teams, and the **matchday temporal-reveal
  chronology** (§7). These arrived as extra phases (the CLAUDE.md milestone list slightly lags
  the code, which is *ahead* of it).
- **M3 (persistence + parallel careers)** and **M5/M6 (wider world polish, release)** — **not
  done.** `src/state/persistence.ts` is a stub. This is the single biggest product gap.

---

## 4. The Systems in Depth (the parts worth carrying forward)

### 4.1 Training — "the right answer changes every week"
The explicit design goal was to avoid a training model you can *solve once*. The lean surface
(three programs, a 70/30 split, an intensity choice) sits on **three live pressures + one cap**:
1. **Readiness × schedule** — pushing hard costs readiness; readiness drives match rating and
   injury risk. The optimum oscillates against the fixture list (which is always on screen as a
   three-week window).
2. **Coach requests** — periodic focus demands: accept for standing, refuse for freedom.
3. **Age phases** — the right training shifts across youth → prime → decline; physicals decay
   late while mental attributes hold or climb. *No single plan is correct for a whole career.*
4. **Diminishing returns** (background) — each attribute gets stickier near its potential.

A firm design rule sits on top: **do not stack more than three live throttles + one cap** — the
life system already showed that overlapping limiters produce *dead stretches*.

### 4.2 The six-meter life layer + the dependency engine
Six 0–100 meters (Professionalism, Lifestyle, Morale, Reputation, Finances, Family) that **drift
to a baseline**, **couple two ways with the on-pitch game** (Morale→form, Professionalism→
development, Reputation→transfers/sponsors; fame/money raise temptation), and **weight which
events fire.**

The event scheduler is a **weighted competition against a large "QUIET" weight** ("nothing
happens"). Each event computes a weight from `base × modifiers × flag-mods`, with hard **gates**
(fails → weight 0), **cooldowns**, and **season caps**. Because QUIET dominates, most weeks are
calm and big life events stay rare (~5–12%/week). The vocabulary — `gate`, `scales_with`,
`scales_inverse`, `flag`, `cooldown`, `maxPerSeason` — is deliberately simple so the **entire
event set is authorable as data**. The canonical example: a paternity claim is *common* at high
Lifestyle + low Family + single, and *impossible* at the opposite — same event, wildly different
lives, made numeric.

### 4.3 Archetype chains — the design's crown jewel
Choices leave **tallies** (pro_points, maverick_points, loyalty_points, family_points,
wealth_points, leader_points). Crossing a threshold awards a **status flag** that gates
**payoff events** the other path can never reach. The critical guard: **this is not virtue vs.
vice.** It is **two viable identities**, each compounding, each with a distinct reward curve and
a distinct failure mode:

| | **Consummate Pro** | **Magnetic Maverick** |
|---|---|---|
| Builds from | declining temptation, saving, loyalty | indulging, swagger, big spending |
| Compounds into | better training, prestige sponsors, longevity, respected legacy | fame, bold brands, a global-icon ceiling |
| Failure mode | a duller, lower-ceiling career; "robotic" | the crash — scandal, DNA test, broke |
| Opportunity cost | capped fame, lower highs | volatility; live catastrophe chains |

A maverick who threads the needle becomes a bigger star than any pro; a pro trades that ceiling
for security and a graceful decline. There are also **One-Club Legend, Family Anchor, Financial
Dynasty, and Respected Leader** chains (they layer — a loyal family-man pro is possible), a
**reinvention arc** for careers that flip, and **two ending-only reflection beats** so cost flags
(`what_if`, `low_profile`) read as emergent story rather than nagging. **This is the system most
worth preserving.** It is what turns a stat sandbox into a *story generator*.

### 4.4 The economy
Finances is both a **0–100 security meter** and a real **budget** beneath it. Two rules give it
teeth: **you can't hire beyond your means** (agents come in cost tiers — Local/Established/Elite —
with visible reach but *hidden* reliability, so you grow into better ones), and **you can
overspend** (never blocked, but splurging past your means → debt → Morale hits → a **broke**
hard-fail). Reconciled as *shock + drift*: event deltas shock the meter, a ledger drives a weekly
drift toward a security target, and tiers map to € via a `moneyUnit`.

### 4.5 The cast & relationships
You are the hub; everyone else reacts. The key distinction (kept rigorously): **Manager = your
agent** (you hire/fire, hidden reliability, advises on the whole career) vs. **Coach = the
club's** (controls selection, hired/fired by the board, you win via *standing*). Plus the Board,
the National-Team coach, teammates/rivals, family/partner, fans, media, and sponsors — each with
defined levers and a relationship map. Much of this cast is *designed but only partially built*
(agent trust, board/coach conversation, media, sponsor obligations are thin in code).

---

## 5. Positive Points — What Went Well

1. **Architecture discipline.** The pure-engine / render-only-UI split held up across a large,
   growing codebase. The engine runs headless, is deterministic, and is genuinely testable.
   **185 tests** is a real safety net for a solo/AI-built game.
2. **Data-driven to the core.** Training, life, economy, and the entire 71-event library live as
   config/JSON. The game can be *balanced without touching logic* — exactly what a fun-tuning
   pass needs.
3. **The "why" contract.** Every meaningful outcome carries a structured `Reason`, enforced by
   tests. The player is never mystified. This is rare and valuable — legibility is a *feature*,
   and it's baked in at the engine level.
4. **Systems depth that generates stories.** The archetype chains, the QUIET-weighted event
   competition, and the two-way meter coupling produce *emergent narrative* rather than scripted
   content. The design achieves its "stories over spreadsheets" pillar.
5. **The temporal-reveal solve (§7).** We took the "human timing" problem seriously and built
   real machinery for it. Consequences are derived *forward* from modelled moments; the UI never
   spoils. This is subtle, hard-won, and mostly invisible when it works.
6. **Scope discipline where it counted.** "Single career at launch, but Career is first-class"
   let the team ship a focused beta without foreclosing the ambitious multi-career world.
7. **Design documentation.** Eleven docs, internally cross-referenced and *reconciled* (open
   questions get resolved and logged). The design thinking is unusually thorough.

---

## 6. Challenges We Faced

1. **Time and human pacing (the headline — see §7).** Making a *simulated* week reveal itself in
   *lived, chronological* order — never the future before the present, never the result before
   the moments — was the hardest and most persistent problem. It touched the match feed, the
   calendar, milestones (debut/first goal), and selection reveal.
2. **Reconciling design against implementation.** Several docs carried illustrative numbers that
   contradicted the canonical spec (the "six vs. eight attributes" tangle; the decline-decay
   formula that, taken literally, decayed physicals *fastest* when trained hardest; the finances
   meter vs. the abstract money tiers). Each needed an explicit reconciliation, logged in the
   docs. Left unmanaged, this kind of drift is how a data-driven game rots.
3. **Avoiding "solvable" and "dead-stretch" systems.** Both training and life risked being
   optimised-once-and-ignored, or over-throttled into stretches where nothing happens. The
   "three live pressures + one cap" rule and the QUIET-weighted rarity were direct responses.
4. **Scope creep past the plan.** The build ran well ahead of the milestone plan (cups,
   transfers, national teams, a persistent world) *before* the foundational **M3 persistence**
   landed. The result is a wide, impressive systems surface sitting on top of a game that
   **can't be saved.**
5. **Keeping the cast legible.** With a dozen NPC roles, the manager/coach/board distinctions had
   to be defended constantly to avoid collapsing into a single "boss" blob.
6. **Balancing was deferred, not done.** All tuning numbers are explicitly "starting guesses for
   playtesting." The game has never had a real balance pass, and *fun* has never been measured.

---

## 7. The Time / Human-Timing Challenge (deep dive)

You flagged this specifically: *how do we make the overall flow follow a human timing that makes
sense — not showing the past before the present?* It is worth its own section because it is both
our hardest problem and our best-engineered answer, and it must survive into any rebuild.

**The problem.** A simulation resolves an entire week (or match) *instantly* — the engine knows
the final score, the rating, whether you debuted, before the player has "watched" a second of it.
Naively surfacing that state **spoils the future** and **breaks the fiction of living a career**.

**What we built:**

- **The match is an ordered `beats[]` feed, revealed one at a time on a single pacing clock owned
  by the engine (not the UI).** The scoreboard is computed **only from revealed beats** — it
  climbs from 0–0 as goals appear; it never shows the final result early. The match clock is
  driven by the *last revealed beat's minute*, so it hits 90′ only at full time.
- **Consequences are derived *forward* from modelled moments, never backward from the outcome.**
  A substitute's **come-on minute is modelled first**, and **minutes played are derived from it**
  (`minutesPlayed = matchLength + stoppage − subOnMinute`). A starter who is hooked has minutes
  *truncated to the withdrawal minute*. The engine tests assert exactly this
  (`matchdayChronology.test.ts`) — the number you end with is a *consequence* of a moment in
  time, not a pre-decided figure reverse-justified.
- **The come-on is a hard stop.** A sub going on (or a debut) is a **mandatory, non-skippable
  tap-to-continue gate** — even "Skip to result" only fast-forwards *up to* the hard stop, then
  waits. The player *experiences* the moment; it isn't summarised past.
- **Milestones fire at the moment they happen, never pre-match.** The **debut milestone is
  evaluated at first appearance** and *only* on a week the player logged real senior minutes — a
  test asserts the debut never fires before minutes exist. The same principle governs first goal,
  first assist, promotions.
- **Selection is revealed without leaking the result.** The pre-match screen shows only squad
  status (starting XI / named sub / benched) — *no* minutes forecast, no debut hint: "a debut and
  a minutes total are outcomes, not pre-match facts." An unused sub gets a **condensed bench
  feed**, deliberately framed identically to a used sub so selection can't leak the outcome.
- **The two-phase advance protects the reveal at the state level.** `beginWeek` returns either a
  resolved week *or* a `decision` (a featured match with interactive beats). On a decision, the
  store **does not commit engine state** — it stashes the pending result and routes to the Match
  screen; the real result only folds in at `resolveWeek` time. Nothing is committed, so nothing
  can be spoiled.
- **Player involvement is confined to the on-pitch window.** In the beat feed, your touches,
  chances, and goals are placed *only* between your come-on and come-off minutes — you cannot
  score before you're on or after you're hooked. Team and opponent goals fall anywhere across
  0–90′. Beats are finally ordered by minute with a rank tiebreak (kickoff/entry first, a
  decision before its resolve, come-off last), and revealed on one cadence
  (`MATCH_FEED.beatIntervalMs`).
- **Season scheduling is chronological up front, resolved just-in-time.** Cup rounds are assigned
  to weeks by a seeded scheduler and *stay* chronological and block-ordered (R1/R2 Opening, QF/SF
  Split, Final Climax; the Final always precedes the World-Cup block) — a test enforces strictly
  increasing round weeks. The cup is then **resolved round-by-round as the clock reaches each
  round's week**; the exit round starts undefined and is set *live*, never pre-revealed.
- **The calendar keeps global order.** A uniform 30-week season of match/rest/double/camp weeks,
  transfer windows that only *resolve* inside their weeks, and a once-a-year demographic tick that
  runs in a fixed rollover order (competitions settle → transfers → ageing → national squads →
  new season). The world moves forward in one direction.

**The lesson for Fable 5.** *Temporal honesty is a first-class design constraint, not a UI
afterthought.* Model moments, derive consequences forward, reveal on a clock, and never let state
that represents the future be readable before its time. Build this into the engine's grain from
day one — retrofitting it is painful.

---

## 8. Current Status

- **It runs and it plays.** A full career loop is playable end-to-end: prospect → weekly
  training → matches with rare decisions → six-meter life with 71 events and archetype chains →
  transfers/loans/cups/national teams → season-end → career-end (retirement or broke).
- **The engine is solid.** Deterministic, tested (185 tests), headless-simulatable, data-driven.
- **The most polished screens** are the Hub (the week control room), the Match feed (the
  chronology engineering is careful), and Personal Life (meters with drill-down, finances ledger,
  agent tiers, previewed choices). The League cup bracket and the transfer/loan request flows are
  substantial.
- **Known gaps / rough edges:**
  - **No persistence.** Saves do not survive a reload; the career archive is in-memory only.
    `src/state/persistence.ts` is a stub. *This is the #1 product blocker.*
  - **No onboarding / tutorial / FTUE.** The game relies entirely on in-context self-explanation.
    A brand-new player is dropped into five tabs and a season with no orientation.
  - **Thin/placeholder presentation** in places: the World Cup bracket is a hardcoded seed grid;
    teammate stats are "illustrative"; agent-trust, board, and coach panels are mostly static
    text; media and sponsor obligations are designed but barely built.
  - **Multi-career is engine-ready but UI-absent** (by intent — deferred).
  - **Never balance-tuned; fun never measured.** All numbers are playtest starting-guesses.
- **Docs vs. code:** the code is *ahead* of the CLAUDE.md milestone list. Trust the code and the
  design docs; treat the milestone numbering as approximate.

---

## 9. Challenges Ahead

### 9.1 Product foundations (must-haves for a shippable game)
- **Persistence.** Real saves (Dexie/IndexedDB was the plan): auto-save each week, resume on
  load, a save browser, careers that survive reload and span seasons. Everything else is built on
  sand without this.
- **Onboarding & FTUE.** A first-time player needs orientation to the week, the tabs, the ladder,
  and the season shape — ideally *diegetic* (a first youth season as a guided tutorial).
- **A retention loop.** The current game has superb *moment-to-moment* legibility but no
  *meta-progression* and no *goals framework*. What makes someone open it tomorrow? (Season
  objectives, a career-goals system the player authors, unlockables across careers, a
  legacy/archive that *rewards* replay.)

### 9.2 Content depth
- **The event library.** 71 events is a strong start; a 25–30-year career arc wants **200–400** to
  avoid repetition. The builder (`scripts/build_events.py`) and the cultural-profile framework
  make this a *content* task, not an engineering one.
- **The unbuilt cast channels:** agent advice + the trust mechanic, transfer negotiation as
  drama, sponsor obligations, coach/board conversations, media as a real system.

### 9.3 Balance & fun
- **A real tuning pass** using the headless sim over many seasons: are the age curves, meter
  drifts, the QUIET weight, wages, and agent costs producing *fun* arcs? Does the difficulty
  curve feel earned? Is any path dominant?
- **The fun question, unanswered.** Nothing has validated that the loop is *enjoyable* over
  hours, only that it is *coherent*. This is the biggest unknown.

### 9.4 The wider world & presentation
- The full 12-country, tiered world (deep/light/shell) is partly built and needs completing and
  performance-proofing.
- Animated key moments (goals, debuts, milestones, status changes) for *impact* — the difference
  between a systems toy and a game people *feel*.
- Mobile packaging (PWA → Capacitor). The pure engine makes this cheap; only the UI is
  web-specific.

---

## 10. Recommendations for Fable 5 (building a *proper* game)

You are building **fresh**, using this as a brief. Concrete guidance:

**Keep (these are proven and hard-won):**
- **The pure-engine / render-only-UI split** and **data-driven-everything.** Non-negotiable; it's
  why the game is tunable and portable.
- **The `Reason` "why" contract.** Legibility is a differentiating feature. Bake it in from line
  one.
- **Temporal honesty (§7).** Model moments, derive consequences forward, reveal on a clock. Make
  it an engine invariant, tested.
- **The archetype-chain design (§4.3).** This is the game's most original idea and its story
  engine. Preserve "two viable identities, neither dominant, each compounding."
- **The "three live pressures + one cap" rule** against solvable/dead systems.
- **Determinism + a headless sim harness** for balancing.

**Reconsider / decide fresh (open, and now is the time):**
- **Lead with fun and retention, not systems completeness.** Our instinct was to build *more
  systems*; the market rewards a *tight, fun, retentive loop* first. Define the retention loop and
  the first-session experience *before* expanding content.
- **Onboarding is a design problem, not a polish task.** Design the first youth season as the
  tutorial.
- **Prioritise persistence before breadth.** Don't add a sixth competition before the game can be
  saved.
- **Right-size the world.** The 12-league persistent world is ambitious; a smaller, deeper,
  fully-featured world may be more fun than a wide, thin one. Let *fun per screen* decide scope.
- **Presentation carries emotion.** Budget for animated key moments early — they convert a
  correct simulation into a *felt* career.
- **Measure fun.** Instrument playtests around session length, return rate, and where players
  *stop*. The design has never had this feedback; it needs it.

**Sequence suggestion (fun-first):**
1. Nail *one* satisfying, saved, onboarded week-loop with the match feed and a handful of life
   events — and *playtest it for fun.*
2. Add the archetype chains and the goals/retention framework.
3. Then expand content (events), then the world, then presentation polish, then mobile.

---

## 11. Appendix

### 11.1 Repo map
```
docs/            11 design docs (see below) + touchline_prototype.jsx (the feel prototype)
src/
  engine/        PURE TypeScript sim — no React/DOM. ~11.4k LOC, 185 tests.
    systems/     tick, training, development, selection, match, status, injuries,
                 coachRequest, lifeMeters, character, events, economy, life, reason,
                 game, calendar, cup, league, loans, transfers, transferRequests,
                 national, nationalTeam, demographics, world
    data/        constants, trainingConfig, lifeConfig, economyConfig, events.json,
                 prospects, positions, attributes
    types/       the shared data model
    index.ts     the ONLY public surface (createCareer, beginWeek/resolveWeek, tick, dispatch…)
  ui/            React + Tailwind — renders engine state, dispatches actions. ~3.4k LOC.
    screens/     Start, Hub, Match, Summary, SeasonEnd, CareerEnd, PersonalLife, History, Tabs
    components/  BottomNav, etc.
  state/         Zustand store (+ persistence.ts STUB)
scripts/         build_events.py (event builder), sim.ts, worldsim.ts (headless play)
```

### 11.2 The design docs (all in `docs/`)
- **PROJECT_INSTRUCTIONS.md** — the full vision, cast, and every decision. *Start here.*
- **KICKOFF_PLAN.md** — the build path (M0–M6), stack, mobile, workflow.
- **PROTOTYPE_SPEC.md** — the validated core-loop slice + formulas.
- **LIFE_SYSTEM.md** — the six meters, the event scheduler, the economy (with the finances
  reconciliation).
- **TRAINING_SYSTEM.md** — the training/development redesign (readiness, growth, age phases,
  coach requests).
- **PERSONAL_LIFE_TAB.md** — the off-pitch home screen + the derived Character read.
- **DECISIONS_AND_EVENTS.md** — the concepts behind the event engine.
- **EVENT_LIBRARY.md** / **EVENT_LIBRARY_EXPANSION.md** — the authored templates + the
  ~30-year expansion and cultural-profile framework.
- **EVENT_CHAINS.md** — the compounding archetype chains (Pro / Maverick / Legend / Anchor /
  Dynasty / Leader), tallies→flags, reinvention/reflection beats.
- **SCREEN_MAP.md** — navigation model and per-screen intent.
- **SQUAD_TRANSFERS_NATIONAL.md** — world structure, transfers, world persistence, national teams.

### 11.3 Key facts at a glance
- **Genre:** first-person single-player football *career/life* RPG (matches simulated, not
  played).
- **Unit of play:** the week. **Session:** mobile-first, bite-sized.
- **Scale:** ~11.4k LOC engine (25 systems) + ~3.4k LOC UI; 188 tests; 71 events; 30-week season;
  deterministic seeded sim.
- **Stack:** Vite + React + TypeScript (strict), Tailwind v4, Vitest, Zustand, Dexie (planned),
  Vercel.
- **Biggest asset:** a legible, tested, data-driven, temporally-honest story-generating engine.
- **Biggest gaps:** persistence, onboarding, a retention loop, balance-for-fun, presentation.

---

*This document reflects the project as of July 2026. It is a briefing, not a spec — the goal is
to give Fable 5 everything it needs to build a game people love to play, using our systems as a
head start rather than a cage.*
