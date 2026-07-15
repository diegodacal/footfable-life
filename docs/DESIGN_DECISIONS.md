# Touchline — Design Decisions (Game Director's Plan)

> The game director's response to `FABLE5_HANDOFF.md` and the eleven design docs. This is the
> plan of record for the fresh build in this repository: my honest read of the brief, the
> engagement model that delivers "months of play, never owed," the fun-first build sequence,
> and a register of every consequential call with its trade-off. Where I overturn a prior
> decision, I say so and defend it. Where the prior work was right, I keep it wholesale and
> say that too.
>
> *Written July 2026, before any code. The reference engine lives in `diegodacal/football-life`;
> this build is fresh, using that work as proven formulas and lessons — not as a codebase.*

---

## 0. TL;DR

- **The simulation was never the problem. The shape of a session and the reason to return
  were.** I'm keeping the engine philosophy wholesale — pure engine, data-driven everything,
  the `Reason` contract, temporal honesty, determinism — and rebuilding the *product* around
  four things the old build never had: **beats, ambitions, identity surfacing, and legacy.**
- **Core reframe:** the *story of a life* is the product; training is the primary
  *interaction*; the week is the metronome; the **beat** — a decision with stakes, a match
  that matters, a payoff landing — is the unit of fun.
- **Retention is four nested pull loops:** the **Next Beat** (this session), **Ambitions**
  (this season), **Identity** (this career), **Legacy** (across careers, i.e. across months).
  Careers are *finite on purpose*: we retain players through completion and serial careers in
  a persistent records book, never through an endless treadmill.
- **Anti-FOMO is an engine invariant, enforced by tests:** no wall clock anywhere in the
  engine, no decay on absence, autosave on every mutation, and a "Previously on your career"
  recap that makes returning after two weeks away feel *better* than never leaving.
- **The world ships at full canon** (owner's decision, on record): 12 real nations × 2
  divisions × 12 clubs = 288 persistent clubs, cross-nation transfers, and national teams
  whose call-ups follow your *birth* nation wherever you play. The build stages it (your
  league fully live first, the world going live in M2, national teams in M3), but launch
  scope is the whole world.
- **First milestone: "One Season of Pull"** — a compressed youth prologue that *is* the
  tutorial, plus a full first professional season: saved, onboarded, stakes-framed, and
  playtested. The acceptance gate is not a feature list; it is *"testers voluntarily start
  season two."*

---

## 1. Honest read of the brief

### 1.1 What is genuinely strong (kept wholesale, no redesign)

1. **The architecture discipline.** Pure-TypeScript engine, render-only UI, data-driven
   everything, seeded determinism, headless simulation. This is exactly the substrate a
   fun-tuning process needs, and it survives contact with a large codebase (the reference
   repo proves it at ~11.4k LOC / 188 tests). Non-negotiable here too.
2. **The `Reason` "why" contract.** Legibility-as-a-feature is rare and it is *this game's*
   differentiator: a life sim where you always understand cause and effect. Baked in from
   line one, enforced by tests.
3. **Temporal honesty (handoff §7).** Model moments, derive consequences forward, reveal on a
   clock, never let future-state be readable before its time. The sub-comes-on-then-minutes-
   derive machinery is the best engineering in the old build. It becomes an engine invariant
   with tests on day one, because retrofitting it is exactly as painful as the handoff says.
4. **The archetype chains** (Pro / Maverick / Legend / Anchor / Dynasty / Leader). Two-plus
   viable compounding identities, none dominant, each with its own failure mode. This is the
   game's most original idea and the heart of the identity loop. Preserved, and given the
   *surfacing* it never had (§3.4).
5. **The six-meter life layer and the QUIET-weighted event engine.** The gate/scales/flag
   vocabulary makes the entire event library authorable as data, and the "same event, wildly
   different lives" property (the paternity-claim worked example) is the story generator.
   Proven; ported as design.
6. **The week as a fully pausable atomic unit.** This is the single biggest asset for the
   engagement mandate: a turn-based game already advances only when the player plays. We
   inherit "time is theirs" for free.
7. **The design honesty culture.** Docs that reconcile their own contradictions and log the
   resolution. I'll keep that: this doc is the first entry in the new decision log.

### 1.2 Where I disagree with the prior work — and what I'm changing

1. **The priority ranking was backwards for this player.** The old order — training #1,
   off-pitch life #2, career strategy #3, drama #4 — is a *simulation builder's* ranking, and
   it produced exactly what it optimized for: a superb sim with a thin story product. The
   player in the brief wants "the breakthrough, the big move, the scandal, the legacy."
   That is drama and career arc — ranked third and fourth. **New ranking: (1) the lived
   story and the identity you're becoming, (2) career arc and its milestones, (3) training
   and development as the primary interaction that drives 1 and 2, (4) systems depth.**
   Training doesn't get simpler — it gets *reframed*: it is the most frequent verb, not the
   fantasy. The most frequent interaction and the product are different things.

2. **The week is too small to be the unit of fun.** A career is 400–600 ticks. The QUIET
   scheduler correctly keeps big events rare (~5–12%/week) — right for drama credibility,
   wrong as session content, because it means most ticks ask nothing and pay nothing. The old
   build's answer was "pacing discipline"; the honest description is *dead air*. My answer is
   twofold: **(a) beats over weeks** — every session must contain at least one real beat, and
   every week must either carry a beat or be *compressible* (§3.1); **(b) stakes framing** —
   the weeks you do play are framed by the Narrator (§3.7) so even a routine fixture arrives
   with a reason to care ("win and you're top; the coach is watching your finishing").

3. **"Your own goals" was a pillar without a mechanism.** "No imposed win condition" is the
   right philosophy and an empty sandbox in practice — most players won't author goals into a
   void. The fix is the **Ambitions system** (§3.3): player-authored goals made concrete,
   trackable, and celebrated, without warping the sim. This is the goals framework the
   handoff lists as never-solved priority #1.

4. **There was nothing between careers.** The archetype chains are a brilliant *one-career*
   engine; the kickoff prompt calls them the best engine for months-long pull, and I'll
   refine that claim: they are the best engine for *caring about this career*. Months come
   from what surrounds careers — the **Legacy layer** (§3.5): a records book, career cards, a
   hall of fame, and variety unlocks. The old design had a "Career Archive" as a passive list;
   it needed to be a destination.

5. **The world was built in the wrong order, not at the wrong size.** My original call was
   to cut the 12-country world to one home nation; the owner overruled it — **the full canon
   ships at launch** (12 nations × 2 divisions × 12 clubs, cross-nation transfers, national
   teams). Decision accepted and now on record (§4.2, register #6). What survives of my
   critique is the *sequencing* and the *surface*: the old build grew the world before
   saves existed, and browsable breadth is not the product. So the world is staged across
   milestones behind the fun gates (§5), and the UI stays player-first — you see the slice
   of the world that is about *you* (your league, your suitors, your country), with the rest
   arriving as news. Sim scale is launch scope; screen scale is still earned fun-per-screen.

6. **The uniform 30-week season is a sim convenience, not a paced story.** Shorter seasons
   mean more season-finales, more windows, more ambition verdicts per hour of play. New
   shape: a compressed youth prologue (~10 weeks) and a **~24-week senior season** (§4.3).

7. **Re-entry was never designed.** The brief's player disappears for two weeks and comes
   back. The old build would greet them with a hub full of state and no memory. The **return
   experience** — recap + next beat, zero penalty — is a first-class feature (§3.2), not
   polish, because burst-play is the core usage pattern we're betting on.

8. **The content math doesn't close and must be planned as scope.** 71 events cannot carry
   12–18 seasons without visible repetition. The builder pipeline makes this a content task;
   I'm putting explicit volume targets on milestones (§4.4) so it's tracked like code.

9. **Some designed systems don't earn their screen.** Agent hidden-reliability with per-recommendation
   trust marks, media as a standalone system, five parallel careers, goalkeepers — each is
   defensible in a bigger game; none pays fun-per-screen at this scope. Cut or folded (§4.1).

---

## 2. The product thesis

**You are living a footballer's life, and the game's job is to make that life feel authored
by your choices and worth telling afterwards.**

- **The unit of fun is the beat.** A beat is anything the player will remember tomorrow: a
  match with stakes, a decision with teeth, a payoff event landing, a milestone, a verdict on
  an ambition. Design rule, enforced in tuning: **every session ≥ 1 real beat; every week
  either carries a beat or is compressible.**
- **Finite careers, serial play.** A career that *ends* — decline, an authored retirement,
  a legacy ceremony — is a story. A game that never ends is a chore with a scoreboard. We
  retain through completion: finish a career, see it enshrined, and want the next one to be
  different. This is the pull-not-push stance taken to its conclusion.
- **Feel target:** Football Manager's "one more match" gravity crossed with a life-sim's
  authorship, delivered in ten-minute bites that respect the player's time.

---

## 3. The engagement model — "months, never owed"

The mandate: engagement for months; no daily requirement, no streaks, no timers, no decay,
no FOMO; bursts and absences are first-class; pull comes from the career, the identity, and
the legacy. Here is the machine that delivers it.

### 3.1 Four nested pull loops

**Ring 1 — The Next Beat** *(this session → the next one; minutes to days).*
The hub leads with a **Next Beat card**: the single most enticing thing ahead — the derby on
Saturday, the pending contract offer, the ambition one goal from complete, the event waiting
in the inbox. Sessions are designed to *end well*: at chapter breaks (pre-window, season
finale run-in, post-milestone) the game offers a clean stopping point — and the Next Beat
card is the last thing shown. Cliffhanger discipline: **never let a session end on nothing.**

Supporting mechanic — **Continue (play to the next beat).** One control advances through
auto-resolvable weeks (using your standing training plan and sensible defaults) and stops at
the next thing that deserves you: a match above a stakes threshold, any decision, any event,
any milestone, low readiness before a big fixture. Skipped weeks compress into a two-line
digest. This is how a 24-week season plays in 2–4 sessions without dead air, and how the
player — not the calendar — owns the pace. (The engine gains a first-class **signal** concept:
every week, `beginWeek` reports *what here deserves attention and why* — same `Reason`
machinery, new consumer.)

**Ring 2 — Ambitions** *(this season; the player-authored goals framework).* §3.3.

**Ring 3 — Identity** *(this career).* The archetype chains, finally *surfaced*: the player
should always be able to feel who they're becoming. §3.4.

**Ring 4 — Legacy** *(across careers — this is the months engine).* §3.5.

### 3.2 The return experience (first-class feature)

The core bet: a player who vanishes for two weeks must return to something *better* than
they left.

- **Perfect resume.** State identical to the second they left — enforced by an engine-level
  test that simulates absence (nothing in the engine can read a wall clock, so this is
  structurally guaranteed, then tested anyway).
- **"Previously on your career."** A recap card, derived entirely from existing state and
  milestones (no new bookkeeping): where you are (club, status, table position), what just
  happened (last 2–3 notable beats), what's at stake next (the Next Beat card). Framed
  diegetically as sports-news catch-up. Shown only after a real absence; dismissible in one
  tap.
- **Zero guilt surface.** No "you missed…", no lapsed anything, no red badges for absence.
  The recap celebrates where the story stands; it never accounts for lost time.

### 3.3 Ambitions — the player-authored goals framework

The mechanism behind "your own goals," designed so it can never warp the sim:

- **A data-driven catalog** (like events): each ambition has gates (career stage, status,
  context — "become a Regular" only offers while you're below Regular), an engine-readable
  progress metric, a horizon (season or career), and completion/failure writes.
- **The player holds up to 3 active ambitions.** Offered at career start (as part of choosing
  who you are) and editable at season breaks. Swapping one out is honest, not punished: the
  record shows "once dreamed of captaining the club" — lives change, and that's story too.
- **Contextual authorship.** The Narrator proposes ambitions *from the fiction*: after a coach
  criticism, "prove him wrong — 10 goals by May"; after a big move abroad, "make this city
  home." Player-authored need not mean menu-authored; it means *chosen*.
- **Ambitions grant story, never power.** Completion writes a legacy entry, fires a
  celebration beat, may set a flag events can read. No stat rewards, no currency. The sim
  stays honest; the goals stay yours.
- **Verdicts are beats.** Season-end reviews each active ambition — completed, progressing,
  failed — with the `Reason` trail of why. Failure is written as drama, not punishment.

### 3.4 Identity surfacing — making the chains felt

The chains exist in the old build; the player could never *see themselves becoming*. Three
cheap, data-driven surfaces fix that:

- **The epithet.** A derived "what they say about you" line (from flags, tallies, and the
  Character band): *"the model professional," "box office," "the local boy who stayed."*
  Lives on the player card; changes rarely; changing is itself a beat.
- **Payoff events as milestones.** Chain-threshold events (the staff notice, box office, the
  armband) are staged as *moment screens* (§3.7), not inbox cards — they are the career
  turning corners.
- **Tallies stay invisible** (the old design's instinct was right): progress is felt through
  flavor, never through a "maverick points: 3/4" bar. The epithet is the only gauge.

### 3.5 Legacy — the months engine

Everything here persists across careers in one player profile. Nothing here grants power.

- **The Records Book.** Every finished career gets a page: a **career card** (name, years,
  clubs, honours, totals, the final epithet, and a defining-moments timeline drawn from
  milestones). Personal records (most goals in a season, longest one-club run, biggest
  transfer) sit in a book that future careers write into — beating *your own* legend is the
  self-authored challenge that needs no designer.
- **The Hall of Fame.** Curated thresholds (a title, 100 goals, a World Cup, a completed
  archetype) enshrine careers with a plaque line. Six archetypes × distinct endings = a
  completion surface measured in months, visible from day one.
- **Variety unlocks — never power.** Finishing careers reveals new *starting contexts*: new
  prospect backgrounds (the late bloomer, the wonderkid with a wild streak, the foreign-born
  returnee), a second-division start, new event packs surfaced as *"stories you haven't
  lived: 3."* Curiosity pull, zero stat advantage, zero gating of core content.
- **Sliding Doors.** Replay any archived prospect with the same seed and make different
  choices. The deterministic engine gives us this almost free, and it is the purest possible
  expression of "your choices authored this life."

### 3.6 Anti-FOMO invariants (engine-level, each with a test)

1. The engine never reads a wall clock (`Date.now`, `new Date()` — banned by lint *and* by
   architecture; time is the week index, full stop).
2. No content keys on real-world dates.
3. No state decays as a function of absence; absence is unobservable to the engine.
4. Autosave on every state mutation; a hard-killed app resumes mid-week correctly.
5. The recap derives from persisted state only — no "engagement" bookkeeping exists to lose.
6. No mechanic depends on notifications; the game is complete with them off (push
   notifications, if ever added, carry story — never obligations).

### 3.7 The Narrator — the system that makes a career *felt*

The handoff's gap #4 (presentation that makes a career felt) gets a system, not a polish
pass. The **Narrator** is a pure-engine module that reads state and emits *framing*, as
data:

- **Stakes lines** for each week ("Win and you're top." / "Rodrigo took your spot last week —
  the coach is watching.").
- **Recaps** (§3.2) and **season-review copy**.
- **Epithets** (§3.4) and ambition proposals (§3.3).
- **Moment screens:** a small set of full-screen, designed beats — debut, first goal, the
  big move, the trophy, the scandal breaking, retirement. One strong layout each, populated
  from data. These are the memories; they're in Milestone 1, not Milestone 4, because the
  *feel* was a never-solved priority, not a nice-to-have.

All Narrator output is authored templates over engine facts — the same data-driven,
"why"-traceable discipline as everything else. No LLM at runtime; determinism holds.

### 3.8 Why this yields months (the arithmetic)

Rough, tunable, but the shape matters: a senior season ≈ 24 weeks ≈ **2–4 sessions** of
10–15 minutes with Continue compression. A career ≈ 12–18 seasons ≈ **40–60 sessions ≈
8–12 hours**. The legacy surface (six archetypes, hall-of-fame thresholds, variety unlocks,
sliding-doors replays) motivates **3–5+ careers**. That is 30–60 hours of *voluntary,
bursty* play — months at the mandated cadence of "gaps in a day," with every session
self-contained and every absence costless.

---

## 4. Scope — right-sizing the world

### 4.1 Keep / reshape / cut

| Verdict | What | Note |
|---|---|---|
| **Keep** | Engine purity, data-driven config, `Reason` contract, temporal honesty, determinism + headless sim | The proven foundation |
| **Keep** | 8 attributes / 3 positions / status ladder / readiness–intensity training / merit selection | Proven loop; formulas ported as starting data |
| **Keep** | Six meters, QUIET event engine, gate vocabulary, chains/tallies/flags, derived Character | The story generator |
| **Keep** | Match beat-feed with in-match decisions, two-phase advance | With adaptive length (big matches get the full feed; routine ones a tight card unless something notable happens) |
| **Keep (engine), defer (UI)** | Career as first-class list in `Game` | Same call as before; still no career-switch UI |
| **New** | Ambitions, Legacy layer, Narrator, Continue/signals, return experience | The product layer (§3) |
| **Reshape** | Season shape: youth prologue ~10 wks, senior season ~24 wks | §4.3 |
| **Reshape** | Economy: wage + sponsor + upkeep + debt→broke stays; agent simplified to visible tiers with a straightforward quality/cost trade | Hidden-reliability trust-marking cut — a meta-game about distrusting UI advice is depth the session never feels |
| **Reshape** | Media: folded into events + Narrator | Not a standalone system |
| **Keep (owner's call)** | The full 12-nation × 288-club persistent world, cross-nation transfers, the demographic tick, national teams with birth-nation eligibility | §4.2; staged across M1–M3, launch scope |
| **Cut (launch)** | Parallel careers UI, goalkeepers, cosmetics, breakthrough traits (§8 of TRAINING_SYSTEM) | Breakthroughs stay parked exactly as the old doc parked them |
| **Cut (forever)** | Any monetization mechanic inside the fiction | Reaffirming the old call |

### 4.2 The world — full canon at launch (owner's decision)

The 12-country world ships, per the original canon and the owner's explicit call:

- **Structure:** 12 real nations (Brazil, Argentina, Spain, France, Morocco, South Africa,
  Nigeria, Japan, China, South Korea, Palestine, Mexico), each with **two divisions of 12
  fictional clubs** — 288 clubs, promotion/relegation, the second tier supporting loans and
  the washout path. Clubs, competitions, and players are fictional; only the nations are real.
- **Persistence:** the whole Tier-1 population is real and persistent (~6,500 lean player
  records — comfortably on-device). The yearly **demographic tick** runs as designed in
  SQUAD_TRANSFERS_NATIONAL: ageing, decline, retirements, youth intake biased toward thin
  positions, a viability floor. The world ages whether or not you're watching it — but only
  *in game time*, never in wall-clock time (the anti-FOMO invariants apply to the world too).
- **Simulation tiers (how 288 clubs stay cheap):** **deep** — your club and positional
  rivals, full weekly fidelity; **light** — every other club holds a real, persistent roster
  but resolves weeks in aggregate (real tables, real transfers, abstracted match detail);
  **shell** — 20 minnow nations with no clubs, generated as squads only at tournament time.
- **Cross-nation transfers — the big move abroad is core fantasy.** Transfer windows, the
  AI club economy by budget tier, incoming offers with scoutable role promises,
  player-initiated requests, free agency — across all 12 nations. A foreign move engages
  the cultural layer the expansion doc designed: origin-keyed homesickness, language,
  climate, faith, and family-expectation events, so moving abroad plays as a *new chapter
  of life*, not a palette swap.
- **National identity — an engine invariant:** nationality is fixed at creation (one of the
  12) and **never changes with your club**. National-team selection is pure merit over the
  nation's entire population, *home and abroad* — a call-up finds you in whatever league you
  play. Club country affects travel/readiness texture and the cultural events; it never
  affects eligibility. Tested like the other invariants.
- **The Global Cup:** the World Cup analog, quadrennial, **32 nations** (12 real + 20
  generated minnows — adopting SQUAD_TRANSFERS_NATIONAL's revision over the older 48;
  smaller field, better bracket, less shell content).
- **The surfacing rule:** sim scale is not screen scale. The UI stays player-first — your
  league table, your suitors, your national team, and a news feed for the world's notable
  moves. Browsable breadth (foreign league tables, other nations' squads) appears only
  where a career reason points at it (scouting a suitor, a rival's career, the Global Cup).

### 4.3 Season & career shape

- **Youth prologue:** ~10 weeks, compressed, ends with the first-team call-up decision. It
  is the tutorial (§5, M1).
- **Senior season:** ~24 weeks — league of 12 clubs on the **compact split format** the old
  canon locked (11-round single round-robin + 5 split rounds = 16 league matches), cup
  rounds woven in (M3+), two transfer windows, national-team weeks overlaying existing
  non-league weeks (no new week type), rest weeks as breathing room. Chapter breaks at
  natural act boundaries.
- **Career:** ~12–18 seasons, age-phased as designed (youth/prime/decline), ending in an
  authored retirement (or the honest hard-fails: washout, broke, career-ending injury).

All week counts are config, tuned in playtest like everything else.

### 4.4 Content plan (tracked like code)

- **M1:** ~30 curated events (youth + first-season appropriate) + ~10 ambitions + Narrator
  template set v1.
- **M2:** ~140 events, 2 chains deep (Pro/Maverick complete), ~25 ambitions, and the
  **far-from-home / cultural set** (homesick, language, climate, faith,
  family-expectation) — required once cross-nation moves go live.
- **M3:** ~220 events, all six chains, reinvention + reflection beats, the Global Cup
  tournament arc, national-team drama.
- **M4:** 250+, guided by playtest repetition reports.
- The builder-script pipeline (source-of-truth JSON, validated, authored via a generator)
  carries over as an approach — it made 71 events cheap; we need it for 250.

---

## 5. Build sequence — fun-first, each milestone playable and pushed

> **Status (v0.1, this branch):** M0 ✅ · M1 ✅ · M2 ✅ · M3 ✅ · M4 ✅ (first
> pass: PWA + moment screens + the fun-tuning harness). 44 engine tests green,
> browser-verified end-to-end. Ongoing: content expansion toward 250+ events,
> presentation polish, and playtest-driven tuning — every number in
> `src/engine/data/` is a starting guess awaiting the M1 playtest gate
> (testers voluntarily starting season two), which requires real humans.

Working rules for every milestone: engine pure and tested; all tuning in data; commit and
push after every meaningful chunk; a deployed preview at each milestone's end; a named
playtest gate that is about *fun*, not features.

### M0 — Foundations *(small, fast)*
Vite + React + TypeScript strict + Tailwind + Vitest + Zustand + **Dexie persistence from
day zero**. Engine/UI/state split scaffolded; seeded RNG; the anti-FOMO invariant tests and
the no-wall-clock lint rule land *before any system code*. The **world data model** (nations,
clubs, tiers, nationality-at-birth) is part of the foundation types, so nothing later
retrofits it. CI + deploy config.

### M1 — **"One Season of Pull"** *(the defensible first milestone)*
The smallest build that tests the actual product bet — not "does the sim work" (we know it
does) but *"does a session pull you into the next one?"*

Contents:
- **The world, generated and breathing:** all 12 nations / 288 clubs / rosters created from
  the seed at career start; your division runs at deep fidelity; every other league resolves
  at light fidelity so season-end tables exist worldwide. No transfers or national teams
  yet — the world is alive, not yet interactive.
- **Career start as story:** three prospect cards framed as backstories, not stat sheets —
  including your nationality (one of the 12) and its cultural profile; position locked;
  initial ambitions chosen.
- **The youth prologue as diegetic tutorial:** ~10 weeks that introduce, in fiction order:
  training focus → the first match feed → selection and your rival → intensity/readiness
  before a big fixture → a first life event → a coach request → the call-up finale.
  Progressive disclosure: surfaces appear when the fiction introduces them (finances panel
  arrives with your first wage).
- **The full weekly loop** (training, readiness, merit selection, temporally-honest match
  feed with rare decisions), six meters + ~30 events, basic economy.
- **The product layer, v1:** Next Beat card, Continue-to-next-beat, stakes lines, chapter
  breaks, moment screens (debut, first goal, call-up), autosave/resume, the recap card.
- **Season one end:** season review, ambition verdicts, the first Records Book page (seeded
  even mid-career), season two begins.

**Playtest gate:** ≥5 testers play unsupervised. Pass = most finish season one *and
voluntarily start season two*; sessions average ≥1 memorable beat (asked, not logged);
nobody reports "I didn't know why" (the Reason contract holding in practice) or "nothing
was happening" (the compression working). Fail = we tune M1 — we do not proceed to M2 on a
loop that isn't pulling.

### M2 — **The Identity Engine & The World Goes Live**
Aging across seasons and age-phased training; the Pro/Maverick chains complete with
payoffs, epithets, and moment screens; Character read; ambitions catalog v2. And the world
becomes interactive: **cross-nation transfers** (windows, AI club economy by budget tier,
incoming offers with scoutable role promises, player-initiated requests, free agency),
contracts and wages proper, the **demographic tick**, and the **far-from-home cultural
event layer** so a foreign move plays as a new life chapter; ~140 events.
**Gate:** two testers' season-3 careers are *visibly different lives*, each can name who
their player is becoming without being asked in those terms — and a tester who moves abroad
describes it as a chapter, not a menu.

### M3 — **The Long Arc**
Full career span: decline, the authored retirement (two curated moments, as designed),
hard-fails with escalating warnings; the Legacy layer complete (Records Book, Hall of Fame,
variety unlocks, Sliding Doors); the remaining four chains + reinvention/reflection beats;
loans; the domestic cups; **national teams** — merit call-ups over each nation's worldwide
population, friendlies on existing weeks, and the quadrennial 32-nation Global Cup as the
career-peak arc.
**Gate:** a tester finishes an entire career, and the strongest observed signal — starts
another unprompted.

### M4 — **Felt & Mobile**
Presentation pass on every moment screen and the match feed; sound/haptics where cheap;
PWA install + Capacitor packaging; performance; 250+ events; accessibility;
release-candidate polish guided by playtest friction lists.

### Continuous from M1 — **the fun-tuning harness**
The headless sim gains *fun-proxy metrics* alongside balance metrics: decision density per
session, max dead-stretch (consecutive no-signal weeks — the Continue system's input),
arc divergence across seeds (are lives actually different?), ambition completion rates,
chain-payoff cadence. Every tuning PR shows before/after on these. Structured playtests at
every milestone gate; where players *stop* is the datum we never had.

---

## 6. Decision register (the call / why / the cost)

1. **Story is the product; training is the interaction.** *Why:* the end user plays for
   story and progression; the old priority ranking built for a different player. *Cost:*
   less pressure toward systems depth; some simulationist richness (e.g. deep agent
   psychology) dies. Accepted.
2. **Beats over weeks; Continue-to-next-beat with engine-level signals.** *Why:* 500 ticks
   of mostly-quiet weeks is dead air at session scale; compression + stakes framing makes
   calm weeks costless instead of boring. *Cost:* players can montage past texture; if the
   digest is weak, skipped weeks feel like lost content. Mitigation: stopping rules are
   generous, digests are Narrator-written, and big beats hard-stop (temporal honesty's
   mandatory gates already give us the pattern).
3. **Finite careers; retention through completion and seriality.** *Why:* pull-not-push
   taken seriously — an ending worth reaching beats an unending obligation; the Legacy layer
   makes each ending a beginning. *Cost:* we forgo the "infinite live-service" retention
   pattern entirely. That's the mandate, and I'd make this call even without the mandate.
4. **Ambitions grant story, never power.** *Why:* reward-bearing quests warp a sim into an
   optimizer's checklist and make authored goals feel like homework. *Cost:* players trained
   by quest-reward games may initially undervalue them; the Narrator's celebration beats and
   legacy entries carry the weight instead.
5. **Legacy unlocks are variety, never power.** *Why:* power unlocks punish new profiles and
   create meta-grind — push, not pull. *Cost:* weaker hook for players who only respond to
   numbers going up. Accepted; wrong players to design for.
6. **The full 12-nation / 288-club world ships at launch** *(owner's decision, overriding my
   proposed cut — on record).* Cross-nation transfers across all 12 leagues; **nationality is
   fixed at birth and national-team eligibility never follows your club** — call-ups reach
   you abroad, selected on pure merit over the nation's worldwide population. My directive
   within the decision: stage the build behind the fun gates (world breathing in M1,
   interactive in M2, national teams in M3), keep the tiered simulation so scale stays cheap,
   and keep the UI player-first so sim scale never becomes screen clutter. *Cost:* a bigger
   content bill (the cultural layer becomes launch content), a heavier M2/M3, and more tuning
   surface. Accepted knowingly — the SQUAD_TRANSFERS_NATIONAL spec means it's engineering to
   a design, not new design.
   - Sub-decision: **Global Cup field = 32** (12 real + 20 minnows), adopting that doc's
     revision over the older 48 — better bracket, less shell content. Flag if you want 48.
   - Sub-decision: dual nationality / switching allegiance is **out of scope** — one birth
     nation, for life. Simple, legible, and true to the fantasy's stakes.
7. **Shorter seasons (~24 wks) and a compressed youth prologue (~10 wks).** *Why:* more
   finales, verdicts, and windows per hour; the tutorial earns its length. League format is
   the canon's own compact split (12 clubs, 11 round-robin + 5 split rounds = 16 matches),
   which fits 24 weeks with cup, windows, and NT weeks. *Cost:* less room for slow-burn
   intra-season arcs; chains compensate across seasons.
8. **Persistence and anti-FOMO invariants before any system code.** *Why:* the old build's
   #1 product blocker was building breadth on sand; the invariants are cheap on day zero and
   brutal to retrofit. *Cost:* M0 is slightly slower. Trivially worth it.
9. **Agent simplified to visible tiers; trust-marking meta-game cut. Media folded into
   events/Narrator.** *Why:* neither survives "does this make a 10-minute session more fun?"
   *Cost:* two designed systems shelved; the drama they carried routes through events, where
   drama already lives.
10. **The Narrator ships in M1.** *Why:* "presentation that makes a career felt" was a
    never-solved priority, and stakes/recap/moment-screens are the retention surface, not
    chrome. *Cost:* content-authoring load starts early. The builder pipeline absorbs it.
11. **Fresh engine, ported wisdom.** *Why:* the new grain (signals, ambitions, narrator
    hooks, invariants) wants to be load-bearing, not bolted on; but every proven formula —
    training math, readiness bands, QUIET weights, selection scoring, event schema — arrives
    as starting config, and the old repo stays open beside us as the reference implementation.
    *Cost:* we re-earn some tests the old repo already had. The 188 tests are the study
    guide; this is much cheaper than it sounds and much safer than porting architecture that
    fought the product.

---

## 7. Alignment asks (then I build)

1. **The engagement model (§3)** — especially the *finite careers, serial retention* stance
   and the story-not-power reward rule. This is the product's spine; I want you nodding, not
   acquiescing.
2. ~~The world cut~~ — **RESOLVED by owner:** the full 12-nation / 288-club world is launch
   scope, with cross-nation transfers and birth-nation national-team eligibility (§4.2,
   register #6). Two sub-decisions inside it are mine and flagged there: the 32-nation
   Global Cup field, and no dual nationality.
3. **The M1 gate** — "testers voluntarily start season two" as the bar we don't build past
   until met.
4. **Naming** — I'll keep building under **Touchline** unless you want the rename now;
   identity work (logo, tone of Narrator voice) starts in M1 either way.

Anything not listed here, I've decided (§6) and will proceed on. Next step after your nod:
M0 scaffold, then M1, committing and pushing continuously.
