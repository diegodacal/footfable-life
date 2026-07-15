# Prototype Spec — Vertical Slice

> A buildable specification for the first playable slice of the Football Career RPG. Derived from PROJECT_INSTRUCTIONS.md; that document remains the source of truth for the full vision. This spec narrows to the smallest thing that proves the core loop is engaging. Placeholder numbers are marked **TUNE** — they exist so the build can start, not because they're final.

---

## 1. Purpose & success criteria

Prove that the **core development loop is fun and readable** on its own:

> pick a prospect → set weekly training → climb the status ladder → earn selection on merit → play matches that also develop you → build form and status → earn more minutes.

The slice succeeds if a player can start a career, advance week by week through a full season, feel their footballer visibly grow, experience being picked and dropped on merit, watch fast matches with the occasional big decision, and end the season with a clear sense of progress — all without the wider systems existing yet.

## 2. Scope

**In scope**
- **One footballer** (the parallel-careers switcher is stubbed to a single slot). *Build note: the engine models Career as first-class inside a `Game` that holds a LIST of careers (length 1 at launch); the UI/loop commit to one and the multi-career auto-resolution loop stays intact but unused, so multiple careers later is a UI + loop change, not an engine rewrite.*
- Career start: **choose 1 of 3 youth prospects**.
- **One club**, one **12-team top division**, one season (a double round-robin ≈ 22 league matches).
- The weekly loop: **training (split focus)**, occasional decision, **match** (fast feed, skip, rare high-stakes decision), **selection & status ladder**, development from **training + minutes**.
- Minimal cast: **Coach** (selection + occasional training request) and **Manager** (a single mid-season **loan** offer if you're stuck on the bench).
- **Career Archive**: a season summary + one saved career record at the end.

**Out of scope for the slice** (exists in the full design, not here)
- The other four parallel careers; off-pitch life events depth; economy/wages/sponsors; media; national team; general transfers; full drama and relationships; goalkeepers.

## 3. The slice, screen by screen

1. **New Career.** Three prospect cards — name, age (16–17), locked **position**, a preview of the 8 attributes, and a coarse **potential band** (see §4). Pick one.
2. **Week hub.** The spine screen: top bar (single player slot), current week/date, current **status** (§5), next fixture, and this week's actions — set **training focus**, resolve any prompt, then **Advance week**. Skipping (doing nothing) triggers **auto-resolution**.
3. **Training panel.** Choose a **primary** and **secondary** program (Technical / Physical / Mental); see the 8 attributes (1–20) with small up-arrows showing recent movement. If the coach has requested a focus, it's shown here to accept or refuse.
4. **Match day.** A fast, skippable feed of **your moments + light team context** (score, big team events) with a live **1–10 rating**; a **rare high-stakes decision** popup when one triggers; final rating + event list.
5. **Week/'season summary.** Rating, development ticks, form, a short coach note, and any **status change**.
6. **Season end + Archive.** Season stats (apps, minutes, rating, goals/assists, status reached) and a saved **Career Archive** entry.

## 4. Attributes & potential

- **8 attributes, 1–20 scale** (integer display, decimal under the hood): *Technical* — Finishing, Passing, Control; *Physical* — Pace, Strength, Stamina; *Mental* — Composure, Positioning.
- **Potential** is a hidden per-attribute ceiling, shown to the player only as a **coarse band** (e.g. a min–max range or a label like "Rotation / Regular / Star potential"), never an exact number.
- **Position weighting** (used by matches and selection) — starting maps, **TUNE**:
  - *Striker:* Finishing, Pace, Composure (high); Passing, Control (med); Strength (med); Positioning, Stamina (low-med).
  - *Central midfielder:* Passing, Stamina, Composure (high); Control, Positioning (med); rest (low-med).
  - *Centre-back:* Strength, Positioning, Pace (high); Composure (med); rest (low).
  - (Add wingers/full-backs as needed; three positions is enough for the slice.)

## 5. Systems (simplified, with placeholder math)

### Status ladder
`Youth → Backup → Rotation → Regular → Star`. Each rung gates minutes. Transitions driven by **ability vs. squad**, **rolling minutes share**, and **age**; can move down as well as up. Starting thresholds **TUNE**:
- Youth→Backup: promoted to first-team squad when weighted ability ≥ squad's weakest starter in position − N, and age ≥ 16.
- Backup→Rotation: minutes share over last ~8 weeks > 25%.
- Rotation→Regular: minutes share > 60% and ability ≥ positional rivals.
- Regular→Star: minutes share > 80% and top-ability in position with strong form.

### Weekly training
For each attribute in the two focused programs:
```
gain = BASE × ageFactor × headroomFactor × coachingFactor × focusWeight
```
- `BASE = 0.05` (TUNE)
- `focusWeight`: primary-program attributes = 1.0, secondary = 0.4  (the ~70/30 split)
- `ageFactor`: ~1.5 at 16–18, 1.0 through prime, tapering after ~30 (TUNE table)
- `headroomFactor = clamp((potential − current) / band, 0..1)` — diminishing near the ceiling
- `coachingFactor`: fixed 1.0 in the slice (facility/coach quality later)
- **Fatigue**: a 0–100 meter; heavy weeks add a little, light/rest weeks recover. High fatigue lightly reduces gains and match rating. Overtraining possible but gentle (TUNE).
- **Coach request**: if present and accepted, the requested program takes the primary slot (+small bonus, +standing); refusing lets you keep your own split (−standing).

### Match development
Playing develops the attributes your position uses:
```
matchGain = BASE_MATCH × (minutes / 90) × oppositionFactor × headroomFactor
```
- `BASE_MATCH = 0.03` (TUNE); `oppositionFactor` scales with how strong the opponent was.
- Net effect: youth (few minutes) grows mostly from training; regular minutes clearly accelerate growth.

### Selection (mostly merit)
Each fixture, for every eligible player in each position, compute:
```
selectionScore = weightedAbility(position) × 0.6 + form × 0.3 + fitness × 0.1  (+ small standing term)
```
The coach fills each position with the highest scorers. You **start** if you top your position slot, are a **sub** if just below, otherwise **benched / left out**. Congested weeks rotate (fatigued players score lower via fitness). Standing is a **minor** factor only.

### Match resolution & the feed
- **Your rating (1–10):** baseline ~6.0 from `weightedAbility(position)`, adjusted by discrete events (goal/assist/key action up; error down) and variance (±). Fitness and form nudge it.
- **Team result:** `teamStrength` vs `opponentStrength` + variance, lightly boosted by your contribution. Enough for a scoreline and a table position; not a full league sim.
- **The feed** plays fast: a timeline of your touches/chances/involvements with score updates as context; **skip-to-result** always available.
- **Rare high-stakes decision:** trigger in ~20% of matches (TUNE), 0–1 per match — e.g. *take the penalty?* (resolves via Composure + Finishing vs. a keeper value), *dive into the tackle?* (Positioning + Strength vs. booking risk), *shoot or square it?*. Clear risk/reward, resolved by the relevant attribute + variance.

### Loan (single, optional)
If you're **Backup** and your minutes share is low by mid-season, the **manager** offers one **loan** to a smaller club (lower `teamStrength`, but you'd start). Accepting swaps your club/opponents for the rest of the season and raises your minutes; declining keeps you fighting for your spot. Demonstrates the escape valve.

## 6. Data model (entities)

- **Player** — name, age, position, `attributes{8}` (decimal), `potentialBands{8}`, form, fitness, status, `minutesLog`, `seasonStats`, `history[]`.
- **Club** — name, division, `teamStrength`, and a **squad** = positional rivals with weighted-ability values (so selection has something to compare against).
- **Coach** — position/attribute preferences, current `trainingRequest` state.
- **Manager** — minimal; holds the mid-season loan offer.
- **Fixture / Match** — opponentStrength, result, playerMinutes, playerRating, events[].
- **Season** — week index, calendar of fixtures, a light standings table.
- **Save** — worldSeed (for deterministic testing), current date, the above state.

## 7. Acceptance criteria (the "done" checklist)

- [ ] Start a career by choosing one of three prospects.
- [ ] Advance week by week through a full season; doing nothing auto-resolves.
- [ ] Set a primary/secondary training split; attributes move **visibly but gently** over the season.
- [ ] Get selected, benched, or left out based on **ability + form**, with rivals as the comparison.
- [ ] Play matches via a **fast, skippable feed** with a live 1–10 rating; occasionally face a **high-stakes decision**.
- [ ] Move up (or down) the **status ladder** at least once in a typical playthrough.
- [ ] Receive and act on the **loan** offer when stuck on the bench.
- [ ] Reach **season end** with a stats summary and a saved **Career Archive** entry.
- [ ] The loop reads clearly: the player can tell **why** things happened.

## 8. Build notes

- **Data-driven:** attributes, position-weight maps, opponent list, and all TUNE constants live in config/JSON, separate from logic.
- **Modular:** development, selection, match-resolution, and status each as isolated, unit-tested modules. Test the development and selection math with fixed seeds.
- **Tech stack: still parked** (see PROJECT_INSTRUCTIONS §9). Target the **simple graphical** UI; a web app is the likely fit but is not decided — the spec is written to be stack-agnostic.
- **Deterministic mode** (fixed seed) for testing and tuning.

## 9. Handoff — POC validated, what the full build adds

The in-chat React mockup (`touchline_prototype.jsx`) has **validated the core loop**: prospect choice, weekly training (focus + intensity), merit-based selection, the status ladder, the match feed with rare high-stakes decisions, injuries, rest weeks, loans, the three-week window, the agent trust mechanic, and the Team/League/Player/People screens. It is a **feel prototype**, not the architecture — single-file, in-memory, one club, lightly-simulated rivals.

**The full Claude Code build takes over for everything that needs real architecture:**
- **Event engine** — the data-driven scheduler, state/flags model, and dependency weighting in DECISIONS_AND_EVENTS.md (off-pitch life, scandals, relationships, media, family), which the single file shouldn't carry.
- **The wider world** — 12 countries × 2 divisions, other championships, and the 48-team Global National Competition, via the tiered simulation (deep / light / shell) in PROJECT_INSTRUCTIONS §3.
- **Persistence** — real saves, up to five parallel careers in one shared, persistent, ageing world.
- **Presentation** — animated key moments (goals, debuts, milestones) for impact.

**The buildable package is three documents:** PROJECT_INSTRUCTIONS.md (the full vision, decisions, and cast), this PROTOTYPE_SPEC.md (the validated slice + math), and DECISIONS_AND_EVENTS.md (the events/dependencies catalogue). Together they're what you hand to Claude Code — plus the mockup as a reference for how the loop should feel.

---

*Everything here is a starting point for a playable slice. Expect to tune numbers once it's running, then expand toward the full design.*
